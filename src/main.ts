// main.ts

import { BibtexManager } from 'bibtex_manager';
import { App, FileSystemAdapter, Plugin, PluginManifest, PluginSettingTab, Setting } from 'obsidian';

import * as fs from 'fs';
import * as path from 'path';

import { BibtexIntegrationSettings, ParserWorkerReply } from 'types';
import { parseBdskUrl, posixToFileURL, resolveBookmark, unwatchFile, watchFile } from 'utils';

import LoadWorker from 'web-worker:./bibtex.worker';
import { WorkerManager } from 'worker_manager';
import { parserDebug } from 'bibtex_parser';

const DEFAULT_SETTINGS: BibtexIntegrationSettings = {
    bibtex_filepath: '',
    import_delay_ms: 1000,
}

export default class BibtexIntegration extends Plugin {
    settings: BibtexIntegrationSettings = DEFAULT_SETTINGS;

    private vaultPath: string;
    private pluginsPath: string;
    private pluginPath: string;
    private bookmark_resolver_path: string;

    public bibtexManager: BibtexManager | null = null;

    private bibtexParserWorker = new WorkerManager(new LoadWorker(), {
        blockingChannel: true,
    });

    constructor(app:App,manifest:PluginManifest) {
        super(app,manifest);
        const adapter = this.app.vault.adapter;
        if (!(adapter instanceof FileSystemAdapter)) {
            throw new Error("The vault folder could not be determined.");
        }

        // Path to vault
        this.vaultPath = adapter.getBasePath();

        // Path to plugins folder
        this.pluginsPath = path.join(this.vaultPath,app.plugins.getPluginFolder());

        // Path to this plugin folder in the vault
        this.pluginPath = path.join(this.pluginsPath,manifest.id);

        // Path to the bookmark resolver utility
        this.bookmark_resolver_path = path.join(this.pluginPath,"bookmark_resolver");
    }
    
    async onload() {
        await this.loadSettings();

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new SampleSettingTab(this.app, this));

        // For example, triggering the worker when a command is run:
        this.addCommand({
            id: 'parse-bibtex',
            name: 'Parse BibTeX file',
            callback: async () => {
                this.parseBibtexFile();
            }
        });

        if(this.settings.import_delay_ms>0) {
            setTimeout(() => {
                this.parseBibtexFile();
            }, this.settings.import_delay_ms);
        } else {
            this.parseBibtexFile();
        }
                
         // Expose the method for external use
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.app.plugins.plugins[this.manifest.id] as any).getFilepathForCitekey = this.getUrlForCitekey.bind(this);
    }

    async parseBibtexFile() {
        let bibtexData: string;
        try {
            const t0 = Date.now();
            bibtexData = await this.readBibFile();
            const t1 = Date.now();
            if (parserDebug) console.log("Bibtex file loaded in " + (t1 - t0) + " milliseconds.");
        } catch {
            console.error(`Unexpected error when loading bibtex file ${this.settings.bibtex_filepath}`);
            return;
        }

        watchFile(this.settings.bibtex_filepath,this);
        
        const bibEntries = await this.bibtexParserWorker.post<ParserWorkerReply>(bibtexData);
        if(bibEntries) {
            this.bibtexManager = new BibtexManager(bibEntries);
        } else {
            this.bibtexManager = null;
        }     
    }

    // Function to read the .bib file and return its contents
    async readBibFile(): Promise < string > {
        if (this.settings.bibtex_filepath.trim() === '') {
            throw new Error("No bib file provided.")
        }
        try {
            const data = await fs.promises.readFile(this.settings.bibtex_filepath, 'utf8');
            return data;
        } catch (err) {
            console.error("Error reading file:", err);
            throw err; // Rethrow the error so the caller knows something went wrong
        }
    }

    // Public method to set citation key and trigger command
    public async getUrlForCitekey(url: string): Promise<string | null> {
        if(this.bibtexManager) {
            const parsedUrl = parseBdskUrl(url);
            
            if(!parsedUrl) {
                console.error("Error:", `the url provided is not valid: ${url}`);
                return null;
            }

            const { citekey, doc } = parsedUrl;

            const bibEntry = await this.bibtexManager.getBibEntry(citekey);

            if(bibEntry) {
                const filepath = await resolveBookmark(this.bookmark_resolver_path,bibEntry,`bdsk-file-${doc}`);
                
                if(filepath) {
                    return posixToFileURL(filepath);
                } else {
                    console.error("Error:", `could not resolve document number ${doc} for citekey ${citekey}`);
                    return null;
                }               
            } else {
                console.error("Error:", `no entry found for the citekey ${citekey}`);
                return null;
            }
        } else {
            console.error("Error:", "BibtexParser not initialized correctly");
            return null;
        }
    }

    onunload() {
        unwatchFile();
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class SampleSettingTab extends PluginSettingTab {
    plugin: BibtexIntegration;

    constructor(app: App, plugin: BibtexIntegration) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;

        containerEl.empty();

        new Setting(containerEl).setName('Importing bibtex entries').setHeading();

        new Setting(containerEl)
            .setName('Bibtex file')
            .setDesc('Filename including path to the bibtex file to be imported')
            .addText(text => text
                .setPlaceholder('Filepath')
                .setValue(this.plugin.settings.bibtex_filepath)
                .onChange(async (value) => {
                    this.plugin.settings.bibtex_filepath = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Delay on start')
            .setDesc('A delay in milliseconds before importing the bibtex entries after the plugin has loaded. This may be useful to make Obsidian more responsive on start.')
            .addText(text => {
                const warningEl = containerEl.createEl('div', { cls: 'mod-warning' });
                warningEl.style.display = 'none';  // Initially hide the warning

                return text
                    .setPlaceholder('Delay in milliseconds')
                    .setValue(`${this.plugin.settings.import_delay_ms}`)
                    .onChange(async (value) => {
                        // Remove any previous warning text
                        warningEl.textContent = '';

                        // Try to parse the input as an integer
                        const parsedValue = parseInt(value, 10);

                        // Check if the value is a valid number and greater than or equal to 0
                        if (isNaN(parsedValue) || parsedValue < 0) {
                            // Show warning if the input is invalid
                            warningEl.textContent = 'Please enter a valid number for the delay.';
                            warningEl.style.display = 'block';
                        } else {
                            // Hide the warning and save the valid value
                            warningEl.style.display = 'none';
                            this.plugin.settings.import_delay_ms = parsedValue;
                            await this.plugin.saveSettings();
                        }
                    });
            });
    }
}