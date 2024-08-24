// bibtex_manager.ts

import { AuthorOptions, BibTeXDict, BibTeXEntry, HighlightType, JournalReferenceOptions, ParsedAuthor, ParserOptions, ParserWorkerInput, ParserWorkerOutput, Queries } from "types";
import { parseUri, posixToFileURL, resolveBookmark } from "utils"
import { AuthorOptionsDefault, JournalReferenceOptionDefault } from "defaults"
import BibtexIntegration from "main";
import { WorkerManager } from "worker_manager";
import { LoadWorker } from 'inline-workers'; // No need for this file to physically exist
import { Notice } from "obsidian";

function processTitles(bibEntriesArray:BibTeXEntry[]) {
    bibEntriesArray.forEach((item:BibTeXEntry) => {
        if(item.fields.hasOwnProperty('title')) {
            const title = item.fields.title;
            if (title[0] === '{' && title[title.length - 1] === '}') {
                item.fields.title = title.slice(1, -1);
            }
        } else {
            item.fields.title = '';
        }
    });
}

/*
function parseAuthors(bibEntriesArray:BibTeXEntry[]) {
    bibEntriesArray.forEach((item:BibTeXEntry) => {
        const authorList = item.fields.author ?? "";

        // Split the authors by "AND"
        const authors = authorList.split(/\s+and\s+/i).map(author => author.trim());
        
        // Format each author
        const parsedAuthors = authors.map((author:string):ParsedAuthor => {
            const [lastName, firstNameAndMidnames] = author.split(',').map(part => part.trim());

            // Process firstNameInitials to only show initials followed by a period
            const firstName = (firstNameAndMidnames ?? "").split(' ')
                .map(name => name.trim().charAt(0).toUpperCase() + '.').join(' ');

            return {first: firstName,last: lastName};
        });
        
        item.authors = parsedAuthors;
    });    
}*/

export function getFormattedJournalReference(bibEntry: BibTeXEntry, options: JournalReferenceOptions = JournalReferenceOptionDefault) {

    const journal = bibEntry.fields.journal ?? "";

    const eprint = bibEntry.fields.eprint;

    const isArxiv = journal.trim().toLowerCase() === 'arxiv' && eprint;

    let journal_vol_page;
    if(isArxiv) {
        journal_vol_page = `${journal}:${eprint}`;
    } else {
        let volume;
        switch(options.highlightVolume) {
        case HighlightType.HTML:
            volume = `<strong>${bibEntry.fields.volume}</strong>` ?? ""
            break;
        case HighlightType.MarkDown:
            volume = `**${bibEntry.fields.volume}**` ?? ""
            break;
        default:
            volume = bibEntry.fields.volume ?? ""
        }
        const page = bibEntry.fields.page ?? "";
        const bothVolPage = [volume,page].join(',')
        journal_vol_page = [journal,bothVolPage].join(' ');
    }
    
    const year = `(${bibEntry.fields.year})` ?? "";

    const journalRef = [journal_vol_page,year].join(' ');

    return journalRef;
}

export function getFormattedAuthors(bibEntry: BibTeXEntry, options: AuthorOptions = AuthorOptionsDefault) {

    const authors = bibEntry.authors;

    const formattedAuthors = authors.map((author:ParsedAuthor):string => {
        if(options.onlyLastName) {
            return author.last;
        } else {
            return `${author.first} ${author.last}`; // Format: "Initials LastName"    
        }   
    })

    if (options.shortList && formattedAuthors.length > 2) {
        return `${formattedAuthors[0]} et al.`;
    } else {
        // Handle the case where there is more than one author
        if (formattedAuthors.length > 1) {
            const lastAuthor = formattedAuthors.pop(); // Remove the last author from the array
            return `${formattedAuthors.join(', ')} and ${lastAuthor}`; // Join the others with commas, add "and" before the last author
        }
        return formattedAuthors.join('');    
    }   
}

export function getFormattedTitle(bibEntry: BibTeXEntry) {
    return bibEntry.fields.title ?? "No title";
}

export function getBibDeskUriLink(bibEntry: BibTeXEntry) {
    return `[${bibEntry.citekey}](x-bdsk://${bibEntry.citekey})`
}

export class BibtexManager {
    private bibEntries: BibTeXDict = {};
    private bibtexParserWorker:WorkerManager<ParserWorkerOutput,ParserWorkerInput> | null = null;

    constructor(private plugin: BibtexIntegration) {
        this.initializeWorker();
    }

    getParserOptions():ParserOptions {
        return {
            debug_parser: this.plugin.settings.debug_parser
        };
    }

    initializeWorker() {
        const bibtexWorker = LoadWorker('bibtex_parser');
        if(!bibtexWorker) return;
        
        // Initialize the worker manager with the worker
        this.bibtexParserWorker = new WorkerManager<ParserWorkerOutput, ParserWorkerInput>(
            bibtexWorker,
            { preventMultipleTasks: true }
        );
    }
    
    async parseBibtexData(bibtex_data: string) {
        if(!this.bibtexParserWorker) return;

        let bibEntriesArray;
        try {
            bibEntriesArray = await this.bibtexParserWorker.post({
                bibtexText: bibtex_data,
                options: this.getParserOptions()
            }) ?? [];
        } catch(error) {
            new Notice("An error occurred when parsing the BibTex file. Check the development console for more details.");
            console.log(error);
            return;
        }

        const t1 = Date.now();
        processTitles(bibEntriesArray);
        const t2 = Date.now();
        if (this.plugin.settings.debug_parser) {
            console.log("BibTex titles processed in " + (t2 - t1) + " milliseconds");
        }

        // const t3 = Date.now();
        // parseAuthors(bibEntriesArray);
        // const t4 = Date.now();
        // if (this.plugin.settings.debug_parser) {
        //     console.log("BibTex authors' entries parsed in " + (t4 - t3) + " milliseconds");
        // }
        
        this.bibEntries = bibEntriesArray.reduce((acc: BibTeXDict, item: BibTeXEntry) => {
            acc[item.citekey] = item;
            return acc;
        }, {});

    }

    getBibEntry(citekey: string): BibTeXEntry | undefined {
        return this.bibEntries[citekey];
    }

    getBibEntriesAsArray():Array<BibTeXEntry> {
        return Object.values(this.bibEntries);
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

