// main.ts

import { App, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';  // Import the os module to get the system temp directory
import * as bplist from 'bplist-parser';

import {parse} from "./peggy.mjs"

import { exec } from 'child_process';

interface Location {
    start: Position;
    end: Position;
}

interface Position {
    offset: number;
    line: number;
    column: number;
}

interface BibTeXDict {
    [key: string]: BibTeXEntry;   // The fields within the entry (e.g., "author", "title", "year", etc.)
}

interface BibTeXEntry {
    [key: string]: string;   // The fields within the entry (e.g., "author", "title", "year", etc.)
}

class MaxMatchesReachedError extends Error {
    location: Location;

    constructor(message: string, location: Location) {
        super(message);
        this.name = "MaxMatchesReachedError";
        this.location = location;  // Store the location where parsing stopped
    }
}


interface BibtexIntegrationSettings {
    mySetting: string;
}

const DEFAULT_SETTINGS: BibtexIntegrationSettings = {
    mySetting: 'default'
}

function base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

function uint8ArrayToBase64(uint8Array: Uint8Array): string {
    let binaryString = '';
    for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binaryString);
}

function bufferToUint8Array(buffer: Buffer): Uint8Array {
    return new Uint8Array(buffer);
}

// Function to convert binary plist to JSON
async function convertBinaryPlistToJson(binaryData: Uint8Array): Promise<unknown> {
    try {
        // Parse the binary plist data
        const [parsedData] = bplist.parseBuffer(Buffer.from(binaryData));
        return parsedData;
    } catch (error) {
        console.error("Error parsing binary plist:", error);
        throw error;
    }
}

// Example usage with binary data
async function processBinaryPlist(binaryData: Uint8Array): Promise<unknown> {
    try {
        const jsonData = await convertBinaryPlistToJson(binaryData);
        return jsonData;
    } catch (error) {
        console.error("Failed to process binary plist:", error);
        return null;
    }
}

// Function to write the binary data to a temporary file
async function writeTempFile(data: Uint8Array): Promise<string> {
    const tempDir = os.tmpdir();  // Get the system temporary directory
    let tempFilePath = path.join(tempDir, `temp_alias_${Date.now()}`);
    console.log(tempFilePath);
    tempFilePath = '/Users/andrea/Downloads/aliases/tmp.bookmark';

    await fs.promises.writeFile(tempFilePath, Buffer.from(data));
    return tempFilePath;
}

// Function to execute the command to resolve the alias
function resolveAlias(tempFilePath: string) {
    return new Promise((resolve, reject) => {
        const command = `/Users/andrea/bin/alisma -a "${tempFilePath}"`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

interface Bookmark {
    bookmark: Buffer;
}

function isBookmark(obj:unknown): obj is Bookmark {
    if (typeof obj !== 'object' || obj === null) {
        return false;
    }

    if(obj.hasOwnProperty('bookmark')) {
        return true;
    } else {
        return false;
    }
}

// Main function
async function processAlias(bibEntry: BibTeXEntry) {
    try {
        // Convert Base64 to binary data
        const binaryData = base64ToUint8Array(bibEntry['bdsk-file-1']);

        const plistData = await processBinaryPlist(binaryData);
        
        if(plistData) {
            if(isBookmark(plistData)) {
                const aliasData = bufferToUint8Array(plistData.bookmark);

                console.log(uint8ArrayToBase64(aliasData));


                // Write binary data to a temporary file
                const tempFilePath = await writeTempFile(aliasData);

                // Run the command to resolve the alias
                // const resolvedPath = await resolveAlias(tempFilePath);
                // console.log('Resolved path:', resolvedPath);

                // Clean up the temporary file
                // fs.unlinkSync(tempFilePath);
            }
            
        }
        
        
    } catch (error) {
        console.error('Error:', error);
    }
}

export default class BibtexIntegration extends Plugin {
    settings: BibtexIntegrationSettings = DEFAULT_SETTINGS;

    private filePath = path.join("/Users/andrea/Documents/Papers library", "test.bib");
    private data = "";
    private bibEntries: BibTeXDict = {};
    
    async onload() {
        await this.loadSettings();

        // This creates an icon in the left ribbon.
        const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
            // Called when the user clicks the icon.
            new Notice('This is a notice!');
        });
        // Perform additional things with the ribbon
        ribbonIconEl.addClass('my-plugin-ribbon-class');

        // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
        const statusBarItemEl = this.addStatusBarItem();
        statusBarItemEl.setText('Status Bar Text');

        // This adds a simple command that can be triggered anywhere
        this.addCommand({
            id: 'open-sample-modal-simple',
            name: 'Open sample modal (simple)',
            callback: () => {
                new SampleModal(this.app).open();
            }
        });
        
        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new SampleSettingTab(this.app, this));

        // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
        this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));

        // For example, triggering the worker when a command is run:
        this.addCommand({
            id: 'parse-bibtex',
            name: 'Parse BibTeX file',
            callback: async () => {
                this.parseBibtex();
            }
        });

        // For example, triggering the worker when a command is run:
        this.addCommand({
            id: 'get-bibtex-entry',
            name: 'Get BibTeX entry',
            callback: async () => {
                const bibEntry = this.bibEntries['Gibble:2024'];
                if(bibEntry) {
                    processAlias(bibEntry);
                }                
            }
        });

        this.parseBibtex();
    }

    onunload() {
        
    }

    async parseBibtex() {
        if (this.data === "") {
            const t0 = Date.now();
            this.data = await this.readBibFile();
            const t1 = Date.now();
            console.log("Bibtex file loaded in " + (t1 - t0) + " milliseconds.");
        }

        const parsedData = {};
        const maxMatches = 100;
        let offset = 0;
        let isParsingComplete = false;
        
        const t2 = Date.now();

        const processNextChunk = (deadline: IdleDeadline) => {
            try {
                while (deadline.timeRemaining() > 0 && !isParsingComplete) {
                    // Slice the data to start parsing from the last known offset
                    parse(this.data?.slice(offset), {
                        MaxMatchesReachedError,
                        parsedData,
                        maxMatches
                    });

                    // If no error is thrown, parsing is complete
                    isParsingComplete = true;
                }

                if (!isParsingComplete) {
                    // If the parsing is not complete, request the next idle callback
                    requestIdleCallback(processNextChunk);
                } else {
                    // Parsing finished
                    const t3 = Date.now();
                    console.log("Bibtex file parsed in " + (t3 - t2) + " milliseconds");
                    console.log("All data processed:", Object.keys(parsedData).length);
                    this.bibEntries = parsedData;
                }
            } catch (error) {
                if (error instanceof MaxMatchesReachedError) {
                    // Update the offset based on the location returned by the error
                    offset += this.getOffsetFromLocation(error.location);

                    // Request the next idle callback
                    requestIdleCallback(processNextChunk);
                } else {
                    console.error("Parsing error:", error);
                }
            }
        };

        // Start processing the first chunk
        requestIdleCallback(processNextChunk);
    }



    // Helper function to convert PeggyJS location to string offset
    getOffsetFromLocation(location: Location): number {
        if (!location) return 0;

        // location contains start and end offsets in the input string
        // Use the end offset to continue from where parsing stopped
        return location.end.offset;
    }


    // Function to read the .bib file and return its contents
    async readBibFile(): Promise<string> {
      try {
        const data = await fs.promises.readFile(this.filePath, 'utf8');
        return data;
      } catch (err) {
        console.error("Error reading file:", err);
        throw err;  // Rethrow the error so the caller knows something went wrong
      }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class SampleModal extends Modal {
    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const {contentEl} = this;
        contentEl.setText('Woah!');
    }

    onClose() {
        const {contentEl} = this;
        contentEl.empty();
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
            .setName('Setting #1')
            .setDesc('It\'s a secret')
            .addText(text => text
                .setPlaceholder('Enter your secret')
                .setValue(this.plugin.settings.mySetting)
                .onChange(async (value) => {
                    this.plugin.settings.mySetting = value;
                    await this.plugin.saveSettings();
                }));
    }
}