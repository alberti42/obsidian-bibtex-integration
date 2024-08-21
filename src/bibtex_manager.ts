// bibtex_manager.ts

import { BibTeXDict, BibTeXEntry } from "types";

export class BibtexManager {
    
    constructor(private bibEntries: BibTeXDict) {

    }

    async getBibEntry(citekey: string): Promise < BibTeXEntry | undefined > {
        return this.bibEntries[citekey];
    }    

}

