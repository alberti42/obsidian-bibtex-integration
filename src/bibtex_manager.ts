// bibtex_manager.ts

import { AuthorOptions, BibTeXDict, BibTeXEntry, JournalReferenceOptions, ParserOptions, Queries } from "types";
import { CitekeyFuzzyModal } from "citekeyFuzzyModal";
import { parseUri, posixToFileURL, resolveBookmark } from "utils"
import { AuthorOptionsDefault, JournalReferenceOptionDefault } from "defaults"
import BibtexIntegration from "main";

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

export function getAuthors(bibEntry: BibTeXEntry, options: AuthorOptions = AuthorOptionsDefault) {

    const authorList = bibEntry.author ?? "";

    // Split the authors by "AND"
    const authors = authorList.split(/\s+and\s+/i).map(author => author.trim());
    
    // Format each author
    const formattedAuthors = authors.map(author => {
        const [lastName, firstNameInitials] = author.split(',').map(part => part.trim());

        if(options.onlyLastName) {
            return lastName;
        } else {
            // Process firstNameInitials to only show initials followed by a period
            const initials = firstNameInitials.split(' ')
                .map(name => name.trim().charAt(0).toUpperCase() + '.').join(' ');

            return `${initials} ${lastName}`; // Format: "Initials LastName"    
        }      
    });

    if (options.shortList && formattedAuthors.length > 2) {
        return `${formattedAuthors[0]}, et al.`;
    } else {
        // Handle the case where there is more than one author
        if (formattedAuthors.length > 1) {
            const lastAuthor = formattedAuthors.pop(); // Remove the last author from the array
            return `${formattedAuthors.join(', ')} and ${lastAuthor}`; // Join the others with commas, add "and" before the last author
        }
        return formattedAuthors.join('');    
    }   
}

export function getJournalReference(bibEntry: BibTeXEntry, options: JournalReferenceOptions = JournalReferenceOptionDefault) {

    const journal = bibEntry.journal ?? "";

    const eprint = bibEntry.eprint;

    const isArxiv = journal.trim().toLowerCase() === 'arxiv' && eprint;

    let journal_vol_page;
    if(isArxiv) {
        journal_vol_page = `${journal}:${eprint}`;
    } else {
        let volume;
        if(options.highlightVolume) {
            volume = `<strong>${bibEntry.volume}</strong>` ?? ""
        } else {
            volume = bibEntry.volume ?? ""
        }
        const page = bibEntry.page ?? "";
        const bothVolPage = [volume,page].join(',')
        journal_vol_page = [journal,bothVolPage].join(' ');
    }
    
    const year = `(${bibEntry.year})` ?? "";

    const journalRef = [journal_vol_page,year].join(' ');

    return journalRef;
}

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
            const filepath = await resolveBookmark(bibEntry,`bdsk-file-${doc}`);
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

