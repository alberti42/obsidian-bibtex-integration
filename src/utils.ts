    // utils.ts

import * as bplist from 'bplist-parser';
import { spawn } from 'child_process';
import * as path from 'path';
import { BibTeXEntry, isBookmark } from 'types';
import { pathToFileURL } from 'url';
import * as chokidar from 'chokidar'; // to watch for file changes
import BibtexIntegration from 'main';

let watcher: chokidar.FSWatcher | null = null;
let watched_filepath: string | null = null;

export function parseBdskUrl(url: string): { citekey: string; doc: number } | null {
    // Regular expression to capture the citekey and the doc number
    const regex = /x-bdsk:\/\/([^?]+)\?doc=(\d+)/;
    
    const match = url.match(regex);
    
    if (match) {
        const citekey = decodeURIComponent(match[1]); // Decode the citekey
        const doc = parseInt(match[2], 10); // Parse the doc number as an integer
        
        return { citekey, doc };
    }
    
    return null; // Return null if the pattern doesn't match
}

// Convert a POSIX file path to a file URL with proper escaping
export function posixToFileURL(posixPath: string): string {
    const absolutePath = path.resolve(posixPath); // Ensure the path is absolute
    const fileUrl = pathToFileURL(absolutePath);
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

// Function to resolve bookmark using the Swift command-line tool with Base64 piping
export function bookmark_resolver(bookmark_resolver_path: string, base64Bookmark: string): Promise<string> {
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

export async function resolveBookmark(bookmark_resolver_path:string, bibEntry: BibTeXEntry, bdsk_file: string): Promise<string|null> {
    try {
        // Convert Base64 to binary data
        const binaryData = base64ToUint8Array(bibEntry[bdsk_file]);

        const plistData = await processBinaryPlist(binaryData);
        
        if(plistData) {
            if(!isBookmark(plistData)) {
                console.error('Error:', 'not valid bookmark');
                return null;
            }


            return await bookmark_resolver(bookmark_resolver_path, uint8ArrayToBase64(plistData.bookmark));
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

    watched_filepath = filepath;
}

export async function unwatchFile() {
    if(watcher) {
        await watcher.close();        
    } 
}

