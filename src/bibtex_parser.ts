// bibtex_parser.ts

import { parse } from "./peggy.mjs"
import { BibTeXDict, MaxMatchesReachedError, ParserWorkerInputs } from 'types';

export let debug_parser = false;

const maxMatches = 1000;

export function set_debug_parser(value:boolean) {
    debug_parser = value;
}

export async function parseBibtex(msg:ParserWorkerInputs): Promise<BibTeXDict | null> {
    
    const parsedData: BibTeXDict | null = {};
    let offset = 0;
    let isParsingComplete = false;

    const bibtexData = msg.bibtexData;
    debug_parser = msg.debug_parser;

    const t2 = Date.now();

    const processNextChunk = (): BibTeXDict | null => { // deadline: IdleDeadline
        try {
            while (!isParsingComplete) {
                // Slice the data to start parsing from the last known offset
                parse(bibtexData.slice(offset), {
                    MaxMatchesReachedError,
                    parsedData,
                    maxMatches: maxMatches
                });

                // If no error is thrown, parsing is complete
                isParsingComplete = true;
            }

            // Parsing finished
            const t3 = Date.now();
            if (debug_parser) console.log("Bibtex file parsed in " + (t3 - t2) + " milliseconds");
            if (debug_parser) console.log(`Imported ${Object.keys(parsedData).length} bibtex entries`);
            return parsedData;

        } catch (error) {
            if (error instanceof MaxMatchesReachedError) {
                // Update the offset based on the location returned by the error
                offset += error.location.end.offset;

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
