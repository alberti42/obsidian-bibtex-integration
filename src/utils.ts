    // utils.ts

import * as bplist from 'bplist-parser';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { BibTeXEntry, isBookmark, ParsedPath, ParsedUri, Queries } from 'types';
import { pathToFileURL } from 'url';
// import * as chokidar from 'chokidar'; // to watch for file changes
import BibtexIntegration from 'main';
import { TAbstractFile, TFile, TFolder, Vault } from 'obsidian';

// let watcher: chokidar.FSWatcher | null = null;
let watched_filepath: string | null = null;

export let bookmark_resolver_path = "";

export function set_bookmark_resolver_path(path: string) {
    bookmark_resolver_path = path;
}

// Joins multiple path segments into a single normalized path.
export function joinPaths(...paths: string[]): string {
    return paths.join('/');
}

export function parseFilePath(filePath: string): ParsedPath {
    const lastSlashIndex = filePath.lastIndexOf('/');

    const dir = lastSlashIndex !== -1 ? filePath.substring(0, lastSlashIndex) : '';
    const base = lastSlashIndex !== -1 ? filePath.substring(lastSlashIndex + 1) : filePath;
    const extIndex = base.lastIndexOf('.');
    const filename = extIndex !== -1 ? base.substring(0, extIndex) : base;
    const ext = extIndex !== -1 ? base.substring(extIndex) : '';

    return { dir, base, filename, ext, path: filePath };
}

export function parseUri(url: string): ParsedUri | null {
    // Regular expression to capture the scheme, address, and optional query string
    const regex = /\s*([^:]+):\/\/([^?]*)(\?(.*))?/;

    const match = url.match(regex);

    if (match) {
        const scheme = match[1];
        const address = decodeURIComponent(match[2]);

        let queries: Queries = {};

        if (match[4]) { // Check if there's a query part
            queries = {};
            const queryString = match[4];
            const fields = queryString.split('&');

            for (const field of fields) {
                const [key, value] = field.split('=');
                queries[key] = value ? decodeURIComponent(value) : null;
            }
        }

        return { scheme, address, queries };
    }

    return null; // Return null if the pattern doesn't match
}

// Convert a POSIX file path to a file URL with proper escaping
export function posixToFileURL(posixPath: string): string {
    const fileUrl = pathToFileURL(posixPath);
    return fileUrl.href; // Return the properly escaped file URL as a string
}

export function base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

export function uint8ArrayToBase64(uint8Array: Uint8Array): string {
    let binaryString = '';
    for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binaryString);
}

export function bufferToUint8Array(buffer: Buffer): Uint8Array {
    return new Uint8Array(buffer);
}

// Function to convert binary plist to JSON
export async function convertBinaryPlistToJson(binaryData: Uint8Array): Promise<unknown> {
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
export async function processBinaryPlist(binaryData: Uint8Array): Promise<unknown> {
    try {
        const jsonData = await convertBinaryPlistToJson(binaryData);
        return jsonData;
    } catch (error) {
        console.error("Failed to process binary plist:", error);
        return null;
    }
}

export async function fileExists(path:string) {
    return await fs.stat(path).then(() => true, () => false);
}

// Function to resolve bookmark using the Swift command-line tool with Base64 piping
export function run_bookmark_resolver(base64Bookmark: string): Promise<string> {
    return new Promise((resolve, reject) => {
        // Use fileExists as a promise and chain the actions using .then()
        fileExists(bookmark_resolver_path).then((exists) => {
            if (!exists) {
                reject(`could not find bookmark_resolver utility at: ${bookmark_resolver_path}`);
                return;
            }

            try {
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

                // Handle process errors
                child.on('error', (error) => {
                    console.error("Child process error:", error);
                    reject(`failed to spawn process: ${error.message}`);
                });

                // Handle process exit
                child.on('close', (code) => {
                    if (code !== 0 || stderr) {
                        console.error(`Error: process exited with code ${code}, stderr: ${stderr}`);
                        reject(`could not resolve bookmark: ${stderr || 'Unknown error'}`);
                    } else {
                        resolve(stdout.trim()); // trim to remove extra newlines
                    }
                });

                // Write the Base64 bookmark to stdin
                if (child.stdin) {
                    child.stdin.write(base64Bookmark);
                    child.stdin.end(); // Signal that we are done writing to stdin
                }
            } catch (error) {
                reject(`could not execute bookmark_resolver utility: ${error}`);
                return;
            }
        }).catch(error => {
            reject(`failed to check if file exists: ${error}`);
            return;
        });
    });
}

export async function resolveBookmark(bibEntry: BibTeXEntry, bdsk_file: string): Promise<string|null> {
    try {
        // Convert Base64 to binary data
        const binaryData = base64ToUint8Array(bibEntry.fields[bdsk_file]);

        const plistData = await processBinaryPlist(binaryData);
        
        if(plistData) {
            if(!isBookmark(plistData)) {
                console.error('Error:', 'not valid bookmark');
                return null;
            }
            return await run_bookmark_resolver(uint8ArrayToBase64(plistData.bookmark));
            // return await run_bookmark_resolver(bookmark_resolver_path, uint8ArrayToBase64(plistData.bookmark));
        } else {
            console.error('Error:', 'not valid plist in bibtex field bdsk-file');
            return null;
        }
        
        
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

/* watch file changes */
export async function watchFile(filepath: string, plugin:BibtexIntegration) {
/*
    // watch the same file already watched
    if(watched_filepath && watched_filepath === filepath) return;

    if(watcher) {
        await watcher.close();
        watched_filepath = null;
    }

    // By default, the add event will fire when a file first appears on disk,
    // before the entire file has been written. Furthermore, in some cases some
    // change events will be emitted while the file is being written. In some cases,
    // especially when watching for large files there will be a need to wait for the
    // write operation to finish before responding to a file creation or modification.
    // Setting awaitWriteFinish to true (or a truthy value) will poll file size,
    // holding its add and change events until the size does not change for a configurable
    // amount of time. The appropriate duration setting is heavily dependent on the OS and
    // hardware. For accurate detection this parameter should be relatively high, making
    // file watching much less responsive. Use with caution. 
    const watchOptions = {
        awaitWriteFinish: {
            stabilityThreshold: 1000,
            pollInterval: 100,
        },
    };

    watcher = chokidar.watch(filepath,watchOptions)
        .on('change', () => {
            if(plugin.settings.debug_parser) console.log(`The BibTex file ${watched_filepath} has changed and will be parsed agained.`)
            plugin.parseBibtexFile();
        }
    );

    watched_filepath = filepath;*/
}

export async function unwatchFile() {
/*    if(watcher) {
        await watcher.close();        
    } */
}

export function isInstanceOfFolder(file: TAbstractFile): file is TFolder {
    return file instanceof TFolder;
}

export function isInstanceOfFile(file: TAbstractFile): file is TFile {
    return file instanceof TFile;
}

export function doesFolderExist(vault: Vault, path: string): boolean {
    const file: TAbstractFile | null = vault.getAbstractFileByPath(path);
    return !!file && isInstanceOfFolder(file);
}

export function doesFileExist(vault: Vault, relativePath: string): boolean {
    const file: TAbstractFile | null = vault.getAbstractFileByPath(relativePath);
    return !!file && isInstanceOfFile(file);
}

export async function createFolderIfNotExists(vault: Vault, folderPath: string) {
    if(doesFolderExist(vault,folderPath)) return;

    try {
        await vault.createFolder(folderPath);
    } catch (error) {
        throw new Error(`Failed to create folder at ${folderPath}: ${error}`);
    }
}
