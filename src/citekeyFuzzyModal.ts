// citekeyFuzzyModal.ts

/* eslint-disable @typescript-eslint/no-inferrable-types */
import { App, FuzzyMatch, FuzzySuggestModal, MarkdownView, normalizePath, Notice, Platform, TFile } from 'obsidian';

import BibtexIntegration from 'main';
import { BibTeXEntry, HighlightType, ParsedPathWithIndex } from 'types';
import { createFolderIfNotExists, joinPaths, parseFilePath, resolveBookmark } from 'utils';
import { BibtexManager, getBibDeskUriLink, getFormattedAuthors, getFormattedJournalReference, getFormattedTitle } from 'bibtex_manager';

// Store the last query input 
let lastQuery:string = "";

async function openBdskDocument(
            app:App,
            pdf_folder:string,
            pdf_filename:string,
            citekey:string,
            doc:number,
            shouldCreateNewLeaf: boolean = true
        ) {
    
    createFolderIfNotExists(app.vault,pdf_folder);
    
    const pdf_content = encodeURI(`x-bdsk://${citekey}?doc=${doc}`);

    const pdf_filepath = normalizePath(joinPaths(pdf_folder,pdf_filename));

    let pdf_file_to_open = app.vault.getFileByPath(pdf_filepath);
    if (pdf_file_to_open instanceof TFile) {
        await app.vault.modify(pdf_file_to_open, pdf_content);
    } else {
        await app.vault.create(pdf_filepath, pdf_content);
        pdf_file_to_open = app.vault.getFileByPath(pdf_filepath);
    }

    if (!(pdf_file_to_open instanceof TFile)) {
        console.error("Error: could not open the file:", pdf_filepath);
        return;
    }

    let leaf = app.workspace.getMostRecentLeaf();
    if (shouldCreateNewLeaf || (leaf && leaf.getViewState().pinned)) {
        leaf = app.workspace.getLeaf('tab');
    }
    if (leaf) {
        leaf.openFile(pdf_file_to_open);
        /*
        const view = leaf.view;
        // This will change the title displayed in the leaf tab
        if (view && view.containerEl) {
            const leaf_title = [
                getAuthors(bibEntry, {shortList:true, onlyLastName:true}),
                `(${year})`
            ].join(' ');
            leaf.tabHeaderEl.setText(leaf_title);
            leaf.tabHeaderEl.ariaLabel = leaf_title;
        }
        */
    } else {
        console.error("Error in creating a leaf for the file to be opened:", pdf_filepath);
    }
}

function insertTextAtCursor(app: App, text: string) {
    // Get the active leaf (tab)
    const leaf = app.workspace.activeLeaf;

    // Ensure the leaf is open and writable (not pinned)
    if (leaf && leaf.view instanceof MarkdownView && !leaf.view.leaf.getViewState().pinned) {
        // Get the editor instance from the leaf
        const editor = leaf.view.editor;

        if (editor) {
            // Get the current cursor position
            const cursor = editor.getCursor();

            // Insert the text at the current cursor position
            editor.replaceRange(text, cursor);

            // Move the cursor to the end of the inserted text
            const newCursorPos = {
                line: cursor.line,
                ch: cursor.ch + text.length // Move the cursor to the end of the inserted text
            };
            editor.setCursor(newCursorPos);
        }
    } else {
        console.log('No active writable leaf or the leaf is pinned.');
    }
}

abstract class BibEntriesFuzzyModal extends FuzzySuggestModal <BibTeXEntry> {
	constructor(protected plugin: BibtexIntegration, protected bibtexManager:BibtexManager) {
        super(plugin.app);
		this.setInstructions(this.getInstructionsBasedOnOS());
	}

	abstract getInstructionsBasedOnOS(): { command: string, purpose: string } [];

	onOpen() {
		super.onOpen();
		this.inputEl.focus();
		this.containerEl.addEventListener('keydown', this.handleKeyDown);
		this.modalEl.classList.add('bibtex-integration');

        // Use the last query
        this.inputEl.value = lastQuery;
        this.updateSuggestions(); 
	}

	onClose() {
        super.onClose();
        this.containerEl.removeEventListener('keydown', this.handleKeyDown);
		this.contentEl.empty();

        // Store the value of the last query
        lastQuery = this.inputEl.value;
	}

	private handleKeyDown = (evt: KeyboardEvent) => {
        // evt.isComposing determines whether the event is part of a key composition
		if (evt.key === 'Enter' && !evt.isComposing) {
            evt.preventDefault();  // Prevent default behavior of inserting a new line
			this.chooser.useSelectedItem(evt);
		}
	}

	getItemText(item: BibTeXEntry): string {
        /*
        let authors_str;
        const len = item.authors.length;
        if(len >= 2) {
            authors_str = item.authors[0].lastName + ' ' + item.authors[len-1].lastName;
        } else if(len == 1) {
            authors_str = item.authors[0].lastName;
        } else {
            authors_str = '';
        }
        return [item.citekey,getTitle(item),authors_str].join(' ');
        */
		return [item.citekey,getFormattedTitle(item)].join(' ');
	}

	renderSuggestion(fuzzyMatch: FuzzyMatch<BibTeXEntry>, el: HTMLElement) {
		el.empty(); // Clear the existing content

		const suggestionContainer = document.createElement('div');
		suggestionContainer.classList.add('bibtex-integration-suggestions');

        const authorsEl = document.createElement('div');
        authorsEl.innerText = getFormattedAuthors(fuzzyMatch.item, {shortList:true, onlyLastName:true});
        authorsEl.classList.add('bibtex-integration-authors');
		
		const titleEl = document.createElement('div');
        titleEl.innerText = getFormattedTitle(fuzzyMatch.item);
        titleEl.classList.add('bibtex-integration-title');

        const journalRefEl = document.createElement('div');
        journalRefEl.innerHTML = getFormattedJournalReference(fuzzyMatch.item, {includingYear:true, highlightVolume: HighlightType.HTML});
        journalRefEl.classList.add('bibtex-integration-jref');

        const citekeyEl = document.createElement('div');
        citekeyEl.classList.add('bibtex-integration-citekey');

        const hashtagEl = document.createElement('span');
        hashtagEl.textContent = '';
        hashtagEl.classList.add('cm-formatting', 'cm-formatting-hashtag', 'cm-hashtag', 'cm-hashtag-begin', 'cm-meta', 'cm-tag-Computer');
        
        const tagEl = document.createElement('span');
        tagEl.textContent = fuzzyMatch.item.citekey;
        tagEl.classList.add('cm-hashtag', 'cm-meta', 'cm-hashtag-end');

        citekeyEl.appendChild(hashtagEl);
        citekeyEl.appendChild(tagEl);

        suggestionContainer.appendChild(authorsEl);
		suggestionContainer.appendChild(titleEl);
        suggestionContainer.appendChild(journalRefEl);
        suggestionContainer.appendChild(citekeyEl);

		el.appendChild(suggestionContainer);
	}

	getItems(): Array<BibTeXEntry> {
		return this.bibtexManager.getBibEntriesAsArray();
	}

	abstract onChooseItem(selectedItem:BibTeXEntry, evt:MouseEvent|KeyboardEvent): void;
}

export class OpenPdfFuzzyModal extends BibEntriesFuzzyModal {
    constructor(plugin: BibtexIntegration, bibtexManager:BibtexManager) {
        super(plugin,bibtexManager);
        this.setPlaceholder('Choose a paper to open...');
    }

    getInstructionsBasedOnOS(): { command: string, purpose: string } [] {
        let altSymbol;
        if (Platform.isMacOS) {
            altSymbol = '⌥';
        } else { // Default to Windows/Linux bindings
            altSymbol = 'Alt';
        }
        return [
            { command: '↑↓', purpose: 'navigate' },
            { command: "↵", purpose: "open the selected paper" },
            { command: altSymbol, purpose: 'open it in a new tab' },
            { command: 'esc', purpose: 'to dismiss' },
        ];
    }

    async openDocumentForBibEntry(bibEntry:BibTeXEntry, shouldCreateNewLeaf:boolean) {
        // Path to the bookmark resolver utility
        const bdskFiles = await Promise.all(
            Object.keys(bibEntry.fields)
                .filter((item: string):boolean => item.startsWith('bdsk-file-'))
                .map(async (item: string, index:number): Promise<ParsedPathWithIndex|null> => {
                    const filepath = await resolveBookmark(bibEntry, item);
                    if (!filepath) return null;
                    return {index,parsedPath:parseFilePath(filepath)};
                }));

        /// Filter out the null results after promises have resolved
        const validBdskFiles = bdskFiles
            .filter((item: ParsedPathWithIndex|null): item is ParsedPathWithIndex => item !== null) // Keep properly resolved docs
            .filter((item: ParsedPathWithIndex) => item.parsedPath.ext.toLowerCase() === '.pdf'); // Keep only PDFs

        const num_bdsk_files = validBdskFiles.length;
        if(num_bdsk_files === 0) {
            const error_msg = "The chosen BibTex entry has no PDF document associated with.";
            console.error(error_msg);
            new Notice(error_msg);
            return;
        } else if (num_bdsk_files === 1) {

            let folder_path;
            if(this.plugin.settings.organize_by_years) {
                folder_path = joinPaths(this.plugin.settings.pdf_folder,bibEntry.fields.year ?? "unknown");
            } else {
                folder_path = this.plugin.settings.pdf_folder;
            }

            openBdskDocument(
                this.app,
                folder_path,
                validBdskFiles[0].parsedPath.base,
                bibEntry.citekey,
                validBdskFiles[0].index+1, // we add +1 because of the indexing starting from 0
                shouldCreateNewLeaf
            );
        } else {
            const modal = new PdfFileFuzzyModal(this.plugin, bibEntry, validBdskFiles);
            modal.open();
        }
    }

    onChooseItem(selectedItem:BibTeXEntry, evt:MouseEvent|KeyboardEvent): void {
        const shouldCreateNewLeaf = evt.altKey;
        this.openDocumentForBibEntry(selectedItem, shouldCreateNewLeaf);
    }
}

export class InsertCitationFuzzyModal extends BibEntriesFuzzyModal {
    constructor(plugin: BibtexIntegration, bibtexManager:BibtexManager) {
        super(plugin,bibtexManager);
        this.setPlaceholder('Choose a paper to cite...');
    }

    getInstructionsBasedOnOS(): { command: string, purpose: string } [] {
        const shiftSymbol = '⇧';
        let altSymbol;
        if (Platform.isMacOS) {
            altSymbol = '⌥';
        } else { // Default to Windows/Linux bindings
            altSymbol = 'Alt';
        }
        return [
            { command: '↑↓', purpose: 'navigate' },
            { command: "↵", purpose: "full citation" },
            { command: altSymbol, purpose: 'short citation' },
            { command: shiftSymbol, purpose: 'include BibDesk URI' },
            { command: 'esc', purpose: 'dismiss' },
        ];
    }
    
    insertCitation(bibEntry:BibTeXEntry,shortCitation:boolean,addBibDeskUri:boolean) {
        const authors = getFormattedAuthors(bibEntry, {shortList:shortCitation, onlyLastName:false});
        const journalRef = getFormattedJournalReference(bibEntry, {includingYear:true, highlightVolume: HighlightType.MarkDown});
        const title = getFormattedTitle(bibEntry);
        
        let citation = [authors, [title, journalRef].join(' ')].join(', ');

        if(addBibDeskUri) {
            const BibDeskUri = getBibDeskUriLink(bibEntry);
            citation = [citation,BibDeskUri].join('; ');
        }
        
        insertTextAtCursor(this.plugin.app,citation);
    }

    onChooseItem(selectedItem:BibTeXEntry, evt:MouseEvent|KeyboardEvent): void {
        const shortCitation = evt.altKey;
        const addBibDeskUri = evt.shiftKey;
        this.insertCitation(selectedItem, shortCitation,addBibDeskUri);
    }
}

export class InsertCitekeyFuzzyModal extends BibEntriesFuzzyModal {
    constructor(plugin: BibtexIntegration, bibtexManager:BibtexManager) {
        super(plugin,bibtexManager);
        this.setPlaceholder('Choose a paper to cite...');
    }

    getInstructionsBasedOnOS(): { command: string, purpose: string } [] {
        const shiftSymbol = '⇧';
        return [
            { command: '↑↓', purpose: 'navigate' },
            { command: "↵", purpose: "citekey as a simple string" },
            { command: shiftSymbol, purpose: 'citekey as a BibDesk URI' },
            { command: 'esc', purpose: 'dismiss' },
        ];
    }
    
    insertCitation(bibEntry:BibTeXEntry,citeKeyAsUri:boolean) {
        const citeKey = citeKeyAsUri ? getBibDeskUriLink(bibEntry) : bibEntry.citekey;
        
        insertTextAtCursor(this.plugin.app,citeKey);
    }

    onChooseItem(selectedItem:BibTeXEntry, evt:MouseEvent|KeyboardEvent): void {
        const citeKeyAsUri = evt.shiftKey;
        this.insertCitation(selectedItem, citeKeyAsUri);
    }
}

export class PdfFileFuzzyModal extends FuzzySuggestModal<ParsedPathWithIndex> {
    constructor(private plugin: BibtexIntegration, private bibEntry: BibTeXEntry, private files:ParsedPathWithIndex[] ) {
        super(plugin.app);
        this.setPlaceholder(`Choose which PDF file to open for the paper ${bibEntry.citekey}...`);
        this.setInstructions(this.getInstructionsBasedOnOS());
    }

    getInstructionsBasedOnOS(): { command: string, purpose: string } [] {
        let altSymbol;
        if (Platform.isMacOS) {
            altSymbol = '⌥';
        } else { // Default to Windows/Linux bindings
            altSymbol = 'Alt';
        }
        return [
            { command: '↑↓', purpose: 'navigate' },
            { command: "↵", purpose: 'open the selected PDF file' },
            { command: altSymbol, purpose: 'open it in a new tab' },
            { command: 'esc', purpose: 'dismiss' },
        ];
    }

    onOpen() {
        super.onOpen();
        this.inputEl.focus();
        this.containerEl.addEventListener('keydown', this.handleKeyDown);
        this.modalEl.classList.add('bibtex-integration');

        // Use the last query
        this.inputEl.value = lastQuery;
        this.updateSuggestions(); 
    }

    onClose() {
        super.onClose();
        this.containerEl.removeEventListener('keydown', this.handleKeyDown);
        this.contentEl.empty();

        // Store the value of the last query
        lastQuery = this.inputEl.value;
    }

    private handleKeyDown = (evt: KeyboardEvent) => {
        // evt.isComposing determines whether the event is part of a key composition
        if (evt.key === 'Enter' && !evt.isComposing && evt.altKey) {
            evt.preventDefault();  // Prevent default behavior of inserting a new line
            this.chooser.useSelectedItem(evt);
        }
    }

    getItemText(item: ParsedPathWithIndex): string {
        return item.parsedPath.filename;
    }

    renderSuggestion(fuzzyMatch: FuzzyMatch<ParsedPathWithIndex>, el: HTMLElement) {
        el.empty(); // Clear the existing content

        const suggestionContainer = document.createElement('div');
        suggestionContainer.classList.add('bibtex-integration-suggestions');

        const nameEl = document.createElement('div');
        nameEl.textContent = fuzzyMatch.item.parsedPath.filename;
        nameEl.classList.add('bibtex-integration-name');

        const dirEl = document.createElement('div');
        dirEl.classList.add('bibtex-integration-dir');
        dirEl.innerText = fuzzyMatch.item.parsedPath.dir;
        
        suggestionContainer.appendChild(nameEl);
        suggestionContainer.appendChild(dirEl);

        el.appendChild(suggestionContainer);
    }

    getItems(): Array<ParsedPathWithIndex> {
        return this.files;
    }

    onChooseItem(selectedItem: ParsedPathWithIndex, evt: MouseEvent | KeyboardEvent): void {
        const shouldCreateNewLeaf = evt.altKey;

        let folder_path;
        if(this.plugin.settings.organize_by_years) {
            folder_path = joinPaths(this.plugin.settings.pdf_folder,this.bibEntry.fields.year ?? "unknown");
        } else {
            folder_path = this.plugin.settings.pdf_folder;
        }

        openBdskDocument(
            this.app,
            folder_path,
            selectedItem.parsedPath.base,
            this.bibEntry.citekey,
            selectedItem.index+1, // we add +1 because of the indexing starting from 0
            shouldCreateNewLeaf
        );
    }
}