// types.ts

import { BibtexParser } from "bibtex_parser";

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

export interface BibTeXEntry {
    [key: string]: string;   // The fields within the entry (e.g., "author", "title", "year", etc.)
}

export class MaxMatchesReachedError extends Error {
    location: Location;

    constructor(message: string, location: Location) {
        super(message);
        this.name = "MaxMatchesReachedError";
        this.location = location;  // Store the location where parsing stopped
    }
}

export interface BibtexWorkerMsg {
    cmd: string;
    bibtex_filepath: string;
}

export interface BibtexIntegrationSettings {
    bibtex_filepath: string;
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
