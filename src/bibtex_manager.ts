// bibtex_manager.ts

import { BibTeXDict, BibTeXEntry } from "types";
import { CitekeyFuzzyModal } from 'citekeyFuzzyModal';
import BibtexIntegration from "main";

export class BibtexManager {
    
    constructor(private plugin: BibtexIntegration, private bibEntries: BibTeXDict) {
    }

    async showBibtexEntriesModal() {
        
        const modal = new CitekeyFuzzyModal(this.plugin, this.bibEntries);
        modal.open();
    }

    async getBibEntry(citekey: string): Promise < BibTeXEntry | undefined > {
        return this.bibEntries[citekey];
    }    

}

