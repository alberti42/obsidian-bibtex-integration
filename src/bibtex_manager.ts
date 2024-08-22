// bibtex_manager.ts

import { BibTeXDict, BibTeXEntry, ParserOptions } from "types";
import { CitekeyFuzzyModal } from 'citekeyFuzzyModal';
import BibtexIntegration from "main";

export class BibtexManager {
    private bibEntries: BibTeXDict = {};
    private parserOptions:ParserOptions;

    constructor(private plugin: BibtexIntegration) {

        this.parserOptions = {
            debug_parser: plugin.settings.debug_parser
        };
    }

    async parseBibtexData(bibtex_data: string) {
        const parserWorker = this.plugin.getParserWorker();

        this.bibEntries = await parserWorker.post({
            bibtex_data,
            options: this.parserOptions
        }) ?? {};
    }

    async showBibtexEntriesModal() {
        const modal = new CitekeyFuzzyModal(this.plugin, this.bibEntries ?? {});
        modal.open();
    }

    async getBibEntry(citekey: string): Promise < BibTeXEntry | undefined > {
        return this.bibEntries[citekey];
    }    

}

