// bibtex_parser.ts

import * as fs from 'fs';
import { parse } from "./peggy.mjs"
import { BibTeXDict, MaxMatchesReachedError } from 'types';

const parserDebug = true;

export class BibtexParser {

    constructor(public bibtex_filePath: string, private maxMatches = 1000) {

    }

    async parseBibtex(): Promise<BibTeXDict | null> {
        let bibtexData: string;
        try {
            const t0 = Date.now();
            bibtexData = await this.readBibFile();
            const t1 = Date.now();
            if (parserDebug) console.log("Bibtex file loaded in " + (t1 - t0) + " milliseconds.");
        } catch {
            return null;
        }

        const parsedData: BibTeXDict | null = {};
        let offset = 0;
        let isParsingComplete = false;

        const t2 = Date.now();

        const processNextChunk = (): BibTeXDict | null => { // deadline: IdleDeadline
            try {
                while (!isParsingComplete) {
                    // Slice the data to start parsing from the last known offset
                    parse(bibtexData.slice(offset), {
                        MaxMatchesReachedError,
                        parsedData,
                        maxMatches: this.maxMatches
                    });

                    // If no error is thrown, parsing is complete
                    isParsingComplete = true;
                }

                // Parsing finished
                const t3 = Date.now();
                if (parserDebug) console.log("Bibtex file parsed in " + (t3 - t2) + " milliseconds");
                if (parserDebug) console.log(`Imported ${Object.keys(parsedData).length} entries`);
                return parsedData;

            } catch (error) {
                if (error instanceof MaxMatchesReachedError) {
                    // Update the offset based on the location returned by the error
                    offset += error.location.end.offset;

                    console.log("Processed chunk");

                    // Request the next idle callback
                    processNextChunk();
                } else {
                    console.error("Parsing error:", error);
                }
                return null;
            }
        };

        // Start processing the first chunk
        processNextChunk();

        return parsedData;
    }

    // Function to read the .bib file and return its contents
    async readBibFile(): Promise < string > {
        if (this.bibtex_filePath.trim() === '') {
            throw new Error("No bib file provided.")
        }
        try {
            const data = await fs.promises.readFile(this.bibtex_filePath, 'utf8');
            return data;
        } catch (err) {
            console.error("Error reading file:", err);
            throw err; // Rethrow the error so the caller knows something went wrong
        }
    }

}
