// main.ts

import { BibtexParser } from 'bibtex_parser';
import { App, FileSystemAdapter, Plugin, PluginManifest, PluginSettingTab, Setting } from 'obsidian';
import * as path from 'path';

import { BibtexIntegrationSettings } from 'types';
import { parseBdskUrl, posixToFileURL, resolveBookmark } from 'utils';

const DEFAULT_SETTINGS: BibtexIntegrationSettings = {
    bibtex_filepath: ''
}

export default class BibtexIntegration extends Plugin {
    settings: BibtexIntegrationSettings = DEFAULT_SETTINGS;

    private vaultPath: string;
    private pluginsPath: string;
    private pluginPath: string;
    private bookmark_resolver_path: string;
    
    bibtexParser: BibtexParser | null = null;

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
                if(this.bibtexParser) {
                    this.bibtexParser.parseBibtex();    
                }
            }
        });

        /*// For example, triggering the worker when a command is run:
        this.addCommand({
            id: 'get-bibtex-entry',
            name: 'Get BibTeX entry',
            callback: async () => {
                if(this.bibtexParser) {
                    const bibEntry = this.bibtexParser.getBibEntry('Gibble:2024')
                    if(bibEntry) {
                        console.log(parseBdskUrl('x-bdsk://Gibble%3A2024?doc=2'));
                        const filename = await resolveBookmark(this.bookmark_resolver_path,bibEntry,'bdsk-file-1');
                        if(filename) {
                            console.log(posixToFileURL(filename));
                        }
                    }                
                }
            }
        });*/
        
        this.bibtexParser = new BibtexParser(this.settings.bibtex_filepath);

        window.setTimeout(async () => {
            if(this.bibtexParser) {
                this.bibtexParser.parseBibtex();    
            }
        }, 2000);
        
         // Expose the method for external use
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.app.plugins.plugins[this.manifest.id] as any).getFilepathForCitekey = this.getUrlForCitekey.bind(this);
    }

    // Public method to set citation key and trigger command
    public async getUrlForCitekey(url: string): Promise<string | null> {
        if(this.bibtexParser) {
            const parsedUrl = parseBdskUrl(url);
            
            if(!parsedUrl) {
                console.error("Error:", `the url provided is not valid: ${url}`);
                return null;
            }

            const { citekey, doc } = parsedUrl;

            const bibEntry = await this.bibtexParser.getBibEntry(citekey);

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

        new Setting(containerEl)
            .setName('Bibtex')
            .setDesc('Filepath of the bibtex file to be imported')
            .addText(text => text
                .setPlaceholder('Filepath')
                .setValue(this.plugin.settings.bibtex_filepath)
                .onChange(async (value) => {
                    this.plugin.settings.bibtex_filepath = value;
                    if(this.plugin.bibtexParser) {
                        this.plugin.bibtexParser.setBibtexFilepath(this.plugin.settings.bibtex_filepath);
                    }
                    await this.plugin.saveSettings();
                }));
    }
}