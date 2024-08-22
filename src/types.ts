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

export type ParserWorkerReply = BibTeXDict | null;

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
