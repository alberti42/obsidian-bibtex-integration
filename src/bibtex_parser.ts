// bibtex_parser.ts

import { parse } from "./peggy.mjs"
import { ParserWorkerInputs, ParserWorkerReply } from 'types';

export async function parseBibtex(msg:ParserWorkerInputs): Promise<ParserWorkerReply> {
    
    const bibtexData = msg.bibtex_data;
    const debug_parser = msg.options.debug_parser;

    const t2 = Date.now();
    const parsedData = parse(bibtexData, {});
    const t3 = Date.now();
    if (debug_parser) {
        console.log("Bibtex file parsed in " + (t3 - t2) + " milliseconds");
        console.log(`Imported ${Object.keys(parsedData).length} bibtex entries`);
    }
            
    return parsedData;
}
