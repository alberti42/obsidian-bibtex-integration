// main.ts

import { App, FileSystemAdapter, Modal, Notice, Plugin, PluginManifest, PluginSettingTab, Setting } from 'obsidian';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';  // Import the os module to get the system temp directory
import * as bplist from 'bplist-parser';

import {parse} from "./peggy.mjs"

import { spawn, exec } from 'child_process';

const bookmark_resolver_script = `use framework "Foundation"
use scripting additions

on resolveBookmarkFromBase64(base64String)
    -- Decode the Base64 string into NSData
    set bookmarkData to current application's NSData's alloc()'s initWithBase64EncodedString:base64String options:0
    
    -- Check if the bookmark data was successfully decoded
    if bookmarkData = missing value then
        return "Error: Failed to decode Base64 string."
    end if
    
    -- Set up variables to resolve the bookmark
    set {resolvedURL, missing value, |error|} to current application's NSURL's URLByResolvingBookmarkData:bookmarkData options:0 relativeToURL:(missing value) bookmarkDataIsStale:(reference) |error|:(reference)
    
    -- Check if there was an error during resolution
    if resolvedURL = missing value then
        return "Error: " & (|error|'s localizedDescription() as text)
    else
        -- Return the resolved file path as POSIX path
        return resolvedURL's |path|() as text
    end if
end resolveBookmarkFromBase64

-- Read the Base64 bookmark string from the argument
on run argv
    set base64Bookmark to item 1 of argv
    return resolveBookmarkFromBase64(base64Bookmark)
end run
`;

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
    const tempFilePath = path.join(tempDir, `temp_alias_${Date.now()}`);
    console.log(tempFilePath);
    await fs.promises.writeFile(tempFilePath, Buffer.from(data));
    return tempFilePath;
}


// Function to resolve bookmark using the Swift command-line tool
function resolveBookmarkWithTool(bookmark_resolver_path: string, bookmarkPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(`${bookmark_resolver_path} "${bookmarkPath}"`, (error, stdout, stderr) => {
            if (error) {
                reject(`Error resolving bookmark: ${error}`);
            } else {
                resolve(stdout.trim());
            }
        });
    });
}


// Function to resolve bookmark using the Swift command-line tool with Base64 piping
function resolveBookmark(bookmark_resolver_path: string, base64Bookmark: string): Promise<string> {
    return new Promise((resolve, reject) => {
        // Spawn the child process with the -p option
        const child = spawn(bookmark_resolver_path, ['-p'], { stdio: ['pipe', 'pipe', 'pipe'] });

        let stdout = '';
        let stderr = '';

        // Collect stdout data
        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        // Collect stderr data
        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        // Handle process exit
        child.on('close', (code) => {
            if (code !== 0 || stderr) {
                reject(`Error resolving bookmark: ${stderr || 'Unknown error'}`);
            } else {
                resolve(stdout.trim());
            }
        });

        // Write the Base64 bookmark to stdin
        if (child.stdin) {
            child.stdin.write(base64Bookmark);
            child.stdin.end(); // Signal that we are done writing to stdin
        }
    });
}


async function resolveBookmarkWithOsascript(base64Bookmark: string): Promise<string> {
    try {
        const { stdout } = await execPromise(`osascript /Users/andrea/Desktop/bookmark_resolver.scpt "${base64Bookmark}"`);
        return stdout.trim();  // Return the resolved path
    } catch (error) {
        console.error(`Error resolving bookmark: ${error}`);
        throw error;  // Re-throw the error so it can be handled by the caller
    }
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
async function processAlias(bookmark_resolver_path:string, bibEntry: BibTeXEntry) {
    try {
        // Convert Base64 to binary data
        const binaryData = base64ToUint8Array(bibEntry['bdsk-file-1']);

        const plistData = await processBinaryPlist(binaryData);
        
        if(plistData) {
            if(isBookmark(plistData)) {

                // console.log(uint8ArrayToBase64(plistData.bookmark));
                // const aliasData = bufferToUint8Array(plistData.bookmark);

                console.log(await resolveBookmark(bookmark_resolver_path, uint8ArrayToBase64(plistData.bookmark)));
                // console.log("Result:",await resolveBookmarkWithOsascript(uint8ArrayToBase64(aliasData)));
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
    private vaultPath: string;
    private pluginsPath: string;
    private pluginPath: string;
    private bookmark_resolver_path: string;

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
                    processAlias(this.bookmark_resolver_path,bibEntry);
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