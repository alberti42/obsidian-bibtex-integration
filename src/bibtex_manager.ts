// bibtex_manager.ts

import { BibTeXDict, BibTeXEntry, ParserOptions, Queries } from "types";
import { CitekeyFuzzyModal } from "citekeyFuzzyModal";
import { parseUri as parseUri, posixToFileURL, resolveBookmark } from "utils"
import BibtexIntegration from "main";
import * as path from "path";

function processTitles(bibEntriesArray:BibTeXEntry[]) {
    bibEntriesArray.forEach((item:BibTeXEntry) => {
        if(item.hasOwnProperty('title')) {
            const title = item.title;
            if (title[0] === '{' && title[title.length - 1] === '}') {
                item.title = title.slice(1, -1);
            }
        } else {
            item.title = '';
        }
    });
}

export class BibtexManager {
    private bibEntries: BibTeXDict = {};
    private parserOptions:ParserOptions;
    private bookmark_resolver_path;

    constructor(private plugin: BibtexIntegration) {

        this.parserOptions = {
            debug_parser: plugin.settings.debug_parser
        };

        this.bookmark_resolver_path = path.join(this.plugin.getPluginPath(),"bookmark_resolver");
    }

    async parseBibtexData(bibtex_data: string) {
        const parserWorker = this.plugin.getParserWorker();

        const bibEntriesArray = await parserWorker.post({
            bibtex_data,
            options: this.parserOptions
        }) ?? [];

        const t1 = Date.now();
        processTitles(bibEntriesArray);
        const t2 = Date.now();
        if (this.plugin.settings.debug_parser) {
            console.log("BibTex titles processed in " + (t2 - t1) + " milliseconds");
        }

        this.bibEntries = bibEntriesArray.reduce((acc: BibTeXDict, item: BibTeXEntry) => {
            acc[item.citekey] = item;
            return acc;
        }, {});
    }

    async showBibtexEntriesModal() {
        const modal = new CitekeyFuzzyModal(this.plugin, this.bibEntries ?? {});
        modal.open();
    }

    getBibEntry(citekey: string): BibTeXEntry | undefined {
        return this.bibEntries[citekey];
    }

    // Public method to set citation key and trigger command
    async getPdfUrlFromUrl(url: string): Promise<string|null> {
        const parsedUrl = parseUri(url);
        
        if(!parsedUrl) {
            console.error("Error:", `the url provided is not valid: ${url}`);
            return null;
        }

        const { scheme, address, queries } = parsedUrl;

        switch(scheme) {
        case 'x-bdsk':
            return await this.getPdfUrlFromBibDeskUri(address, queries)
        default:
            console.error("Error:", `not recognized URI scheme: ${scheme}`);
            return null;
        }
    }

    async getPdfUrlFromBibDeskUri(address: string, queries: Queries): Promise<string | null> {
        const citekey = address;
        const doc = parseInt(queries.doc ?? "1", 10); // Parse the doc number as an integer
        if(isNaN(doc)) {
            console.error("Error:","provided non-integer document number:", queries.doc);
            return null;
        }

        const bibEntry = this.getBibEntry(citekey);
        if(bibEntry) {
            // Path to the bookmark resolver utility
            const filepath = await resolveBookmark(this.bookmark_resolver_path,bibEntry,`bdsk-file-${doc}`);
            if(filepath) {
                return posixToFileURL(filepath);
            } else {
                console.error("Error:", `document number ${doc} of citekey ${citekey} could not be resolved`);
                return null;
            }               
        } else {
            console.error("Error:", `no entry found for the citekey ${citekey}`);
            return null;
        }
    }
}

