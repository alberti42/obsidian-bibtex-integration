// utils.ts

import * as bplist from 'bplist-parser';
import { spawn } from 'child_process';
import * as path from 'path';
import { BibTeXEntry, isBookmark } from 'types';
import { pathToFileURL } from 'url';

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

