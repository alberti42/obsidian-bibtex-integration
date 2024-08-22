// types.ts

export interface Location {
    start: Position;
    end: Position;
}

export interface Position {
    offset: number;
    line: number;
    column: number;
}

export interface BibTeXDict {
    [key: string]: BibTeXEntry;   // The fields within the entry (e.g., "author", "title", "year", etc.)
}

export type ParserWorkerReply = BibTeXEntry[] | null;

export interface ParserWorkerInputs {
    bibtex_data: string;
    options: ParserOptions;
}

export interface ParserOptions {
    debug_parser: boolean;
}

export interface BibTeXEntry {
    citekey: string;
    type: string;
    [key: string]: string;   // The fields within the entry (e.g., "author", "title", "year", etc.)
}

export interface BibtexIntegrationSettings {
    bibtex_filepath: string;
    import_delay_ms: number;
    debug_parser: boolean;
    widthRecentList: number;
    pdf_folder: string;
}

export interface Bookmark {
    bookmark: Buffer;
}

export function isBookmark(obj:unknown): obj is Bookmark {
    if (typeof obj !== 'object' || obj === null) {
        return false;
    }

    if(obj.hasOwnProperty('bookmark')) {
        return true;
    } else {
        return false;
    }
}

export interface ParsedPath {
    dir: string,
    base: string,
    filename: string,
    ext: string,
    path: string
}

export interface ParsedUri {
    scheme: string;
    address: string;
    queries: Queries;
}

export interface Queries {
    [key: string]: string|null;
}

/* Citation formats */

export interface AuthorOptions {
    shortList: boolean,
    onlyLastName: boolean,
}

export interface JournalReferenceOptions {
    includingYear: boolean,
    highlightVolume: true,
}
