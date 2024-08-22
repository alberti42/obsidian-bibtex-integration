// main.ts

import { BibtexManager } from 'bibtex_manager';
import { App, FileSystemAdapter, Plugin, PluginManifest, PluginSettingTab, Setting, TextComponent, ToggleComponent } from 'obsidian';

import * as fs from 'fs';
import * as path from 'path';

import { BibtexIntegrationSettings, ParserWorkerInputs, ParserWorkerReply } from 'types';
import { unwatchFile, watchFile } from 'utils';

import LoadWorker from 'web-worker:./bibtex.worker';
import { WorkerManager } from 'worker_manager';
import { DEFAULT_SETTINGS } from 'defaults';

export default class BibtexIntegration extends Plugin {
    settings: BibtexIntegrationSettings = DEFAULT_SETTINGS;

    private vaultPath: string;
    private pluginsPath: string;
    private pluginPath: string;
    
    public bibtexManager: BibtexManager | null = null;

    private bibtexParserWorker = new WorkerManager<ParserWorkerReply,ParserWorkerInputs>(
        new LoadWorker(),
        {
            blockingChannel: true,
        }
    );

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
    }

    getParserWorker() {
        return this.bibtexParserWorker;
    }
    
    getPluginPath() {
        return this.pluginPath;
    }

    async onload() {
        await this.loadSettings();

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new BibtexIntegrationSettingTab(this.app, this));

        // For example, triggering the worker when a command is run:
        this.addCommand({
            id: 'parse-bibtex',
            name: 'Parse BibTeX file',
            callback: async () => {
                this.parseBibtexFile();
            }
        });

        this.addCommand({
            id: 'open-pdf-from-bibtex-entry',
            name: 'Open PDF file of BibTex entry',
            callback: () => {
                if(this.bibtexManager) this.bibtexManager.showBibtexEntriesModal();
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
        (this.app.plugins.plugins[this.manifest.id] as any).getFilepathForCitekey = this.getPdfUrlFromUrl.bind(this);
    }

    async parseBibtexFile() {
        let bibtex_data: string;
        try {
            const t0 = Date.now();
            bibtex_data = await this.readBibFile();
            const t1 = Date.now();
            if (this.settings.debug_parser) console.log("BibTex file loaded in " + (t1 - t0) + " milliseconds.");
        } catch {
            console.error(`Unexpected error when loading BibTex file ${this.settings.bibtex_filepath}`);
            return;
        }

        watchFile(this.settings.bibtex_filepath,this);
        
        this.bibtexManager = new BibtexManager(this);

        this.bibtexManager.parseBibtexData(bibtex_data);
    }

    // Public method to set citation key and trigger command
    public async getPdfUrlFromUrl(url: string): Promise<string | null> {
        if(this.bibtexManager) {
            return await this.bibtexManager.getPdfUrlFromUrl(url);
        } else {
            console.error("Error:", "BibTex parser not initialized correctly");
            return null;    
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

class BibtexIntegrationSettingTab extends PluginSettingTab {
    plugin: BibtexIntegration;

    private bibtex_filepath_original: string;

    constructor(app: App, plugin: BibtexIntegration) {
        super(app, plugin);
        this.plugin = plugin;
        this.bibtex_filepath_original = DEFAULT_SETTINGS.bibtex_filepath;
    }

    display(): void {
        // Save the original setting before the user has the chance to change it
        this.bibtex_filepath_original = this.plugin.settings.bibtex_filepath;

        const {containerEl} = this;

        containerEl.empty();

        new Setting(containerEl).setName('Importing BibTex entries').setHeading();

        const bibtex_filepath_setting = new Setting(containerEl)
            .setName('BibTex file')
            .setDesc('Filename including path to the BibTex file to be imported');

        let bibtex_filepath_text:TextComponent;
        bibtex_filepath_setting.addText(text => {
                bibtex_filepath_text = text;
                text.setPlaceholder('Filepath')
                .setValue(this.plugin.settings.bibtex_filepath)
                .onChange(async (value) => {
                    this.plugin.settings.bibtex_filepath = value;
                    await this.plugin.saveSettings();
                })
            });

        bibtex_filepath_setting.addExtraButton((button) => {
            button
                .setIcon("reset")
                .setTooltip("Reset to default value")
                .onClick(() => {
                    const value = DEFAULT_SETTINGS.bibtex_filepath;
                    bibtex_filepath_text.setValue(value);
                    this.plugin.settings.bibtex_filepath = value;
                    this.plugin.saveSettings();
                });
        });

        const import_delay_setting = new Setting(containerEl)
            .setName('Delay on start')
            .setDesc('A delay in milliseconds before importing the BibTex entries after the plugin has loaded. This may be useful to make Obsidian more responsive on start.');

        let import_delay_text:TextComponent;
        import_delay_setting.addText(text => {
                import_delay_text = text;
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

        import_delay_setting.addExtraButton((button) => {
            button
                .setIcon("reset")
                .setTooltip("Reset to default value")
                .onClick(() => {
                    const value = DEFAULT_SETTINGS.import_delay_ms;
                    import_delay_text.setValue(`${value}`);
                    this.plugin.settings.import_delay_ms = value;
                    this.plugin.saveSettings();
                });
        });

        const debug_parser_setting = new Setting(containerEl)
            .setName('Debug BibTex parser')
            .setDesc('If this option is enabled, information about the parsed BibTex files are provided in the developed console.');


        let debug_parser_toggle: ToggleComponent;
        debug_parser_setting.addToggle(toggle => {
            debug_parser_toggle = toggle;
            toggle
            .setValue(this.plugin.settings.debug_parser)
            .onChange(async (value: boolean) => {
                this.plugin.settings.debug_parser = value;
                this.plugin.saveSettings();
            })
        });

        debug_parser_setting.addExtraButton((button) => {
            button
                .setIcon("reset")
                .setTooltip("Reset to default value")
                .onClick(() => {
                    const value = DEFAULT_SETTINGS.debug_parser;
                    debug_parser_toggle.setValue(DEFAULT_SETTINGS.debug_parser);
                    this.plugin.settings.debug_parser = value;
                    this.plugin.saveSettings();
                });
        });
    }

     hide(): void {
        super.hide();
        // Detect when the settings pane is closed
        
        if(this.bibtex_filepath_original !== this.plugin.settings.bibtex_filepath) {
            // if the setting has changed, parse the new bibtex file
            this.plugin.parseBibtexFile();
        }
    }
}

export interface ParsedUri {
    scheme: string;
    address: string;
    query: Queries|null;
}

export interface Queries {
    [key: string]: string|null;
}
