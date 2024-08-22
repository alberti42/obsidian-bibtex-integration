/* eslint-disable @typescript-eslint/no-inferrable-types */
import { App, FuzzyMatch, FuzzySuggestModal, Notice, Platform, TFile } from 'obsidian';

import BibtexIntegration from 'main';
import { BibTeXDict, BibTeXEntry, ParsedPath } from 'types';
import { createFolderIfNotExists, joinPaths, parseFilePath, resolveBookmark } from 'utils';
import { getAuthors, getJournalReference } from 'bibtex_manager';

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

    const pdf_filepath = joinPaths(pdf_folder,pdf_filename);

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

export class CitekeyFuzzyModal extends FuzzySuggestModal <BibTeXEntry> {
	constructor(private plugin: BibtexIntegration, private bibtexEntries: BibTeXDict ) {
        super(plugin.app);
		this.setPlaceholder('Choose a paper to open...');
		this.setInstructions(this.getInstructionsBasedOnOS());
	}

	getInstructionsBasedOnOS(): { command: string, purpose: string } [] {
		if (Platform.isMacOS) {
			return [
				{ command: '↑↓', purpose: 'to navigate' },
				{ command: "↵", purpose: "to open the selected file" },
				{ command: '⌘+↵', purpose: 'to open in a new tab' },
				{ command: 'esc', purpose: 'to dismiss' },
			];
		} else { // Default to Windows/Linux bindings
			return [
				{ command: '↑↓', purpose: 'to navigate' },
				{ command: "↵", purpose: "to open the selected file" },
				{ command: 'Ctrl+↵', purpose: 'to open in a new tab' },
				{ command: 'esc', purpose: 'to dismiss' },
			];
		}
	}

	async openDocumentForBibEntry(bibEntry: BibTeXEntry, shouldCreateNewLeaf: boolean = true) {
        // Path to the bookmark resolver utility
        const bdskFiles = await Promise.all(
            Object.keys(bibEntry)
                .filter((item: string) => item.startsWith('bdsk-file-'))
                .map(async (item: string): Promise<ParsedPath | null> => {
                    const filepath = await resolveBookmark(bibEntry, item);
                    if (!filepath) return null;
                    return parseFilePath(filepath);
                }));

        // Filter out the null results after promises have resolved
        const validBdskFiles = bdskFiles
            .filter((item: ParsedPath | null): item is ParsedPath => item !== null) // Keep properly resolved docs
            .filter((item: ParsedPath) => item.ext.toLowerCase() === '.pdf'); // Keep only PDFs

        const num_bdsk_files = validBdskFiles.length;
        if(num_bdsk_files === 0) {
            const error_msg = "The chosen BibTex entry has no PDF document associated with.";
            console.error(error_msg);
            new Notice(error_msg);
            return;
        } else if (num_bdsk_files === 1) {
            openBdskDocument(
                this.app,
                joinPaths(this.plugin.settings.pdf_folder,bibEntry.year ?? "unknown"),
                    validBdskFiles[0].base,
                    bibEntry.citekey,
                    1,
                    shouldCreateNewLeaf
                );
        } else {
            const modal = new PdfFileFuzzyModal(this.plugin, bibEntry, validBdskFiles);
            modal.open();
        }
	}

	onOpen() {
		super.onOpen();
		this.inputEl.focus();
		this.containerEl.addEventListener('keydown', this.handleKeyDown);
		this.applyWidthSetting();
	}

	applyWidthSetting() {
        const recentFilesPrompt = document.querySelector('.prompt') as HTMLElement;
        if (recentFilesPrompt && this.plugin.settings.widthRecentList) {
            recentFilesPrompt.style.width = `${this.plugin.settings.widthRecentList}px`;
        }
    }

	onClose() {
		this.containerEl.removeEventListener('keydown', this.handleKeyDown);
		super.onClose();
		this.contentEl.empty();
	}

	private handleKeyDown = (evt: KeyboardEvent) => {
		// evt.isComposing determines whether the event is part of a key composition
		if (evt.key === 'Enter' && !evt.isComposing && evt.metaKey) {
			this.chooser.useSelectedItem(evt);
		}
	}

	getItemText(item: BibTeXEntry): string {
		return item.citekey + ' ' + item.title;
	}

	renderSuggestion(fuzzyMatch: FuzzyMatch<BibTeXEntry>, el: HTMLElement) {
		el.empty(); // Clear the existing content

		const suggestionContainer = document.createElement('div');
		suggestionContainer.classList.add('bibtex-integration-suggestions');

        const authorsEl = document.createElement('div');
        authorsEl.innerText = getAuthors(fuzzyMatch.item, {shortList:true, onlyLastName:true});
        authorsEl.classList.add('bibtex-integration-authors');
		
		const titleEl = document.createElement('div');
        titleEl.innerText = fuzzyMatch.item.title ?? "No title";
        titleEl.classList.add('bibtex-integration-title');

        const journalRefEl = document.createElement('div');
        journalRefEl.innerHTML = getJournalReference(fuzzyMatch.item, {includingYear:true, highlightVolume: true});
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
		return Object.values(this.bibtexEntries);
	}

	onChooseItem(selectedItem:BibTeXEntry, evt:MouseEvent|KeyboardEvent): void {
		const metaKeyPressed = evt.metaKey;
		this.openDocumentForBibEntry(selectedItem, metaKeyPressed);
	}
}

export class PdfFileFuzzyModal extends FuzzySuggestModal<ParsedPath> {
    constructor(private plugin: BibtexIntegration, private bibEntry: BibTeXEntry, private files:ParsedPath[] ) {
        super(plugin.app);
        this.setPlaceholder(`Choose which PDF file to open for the paper ${bibEntry.citekey}...`);
        this.setInstructions(this.getInstructionsBasedOnOS());
    }

    getInstructionsBasedOnOS(): { command: string, purpose: string } [] {
        if (Platform.isMacOS) {
            return [
                { command: '↑↓', purpose: 'to navigate' },
                { command: "↵", purpose: "to open the selected file" },
                { command: '⌘+↵', purpose: 'to open in a new tab' },
                { command: 'esc', purpose: 'to dismiss' },
            ];
        } else { // Default to Windows/Linux bindings
            return [
                { command: '↑↓', purpose: 'to navigate' },
                { command: "↵", purpose: "to open the selected file" },
                { command: 'Ctrl+↵', purpose: 'to open in a new tab' },
                { command: 'esc', purpose: 'to dismiss' },
            ];
        }
    }

    onOpen() {
        super.onOpen();
        this.inputEl.focus();
        this.containerEl.addEventListener('keydown', this.handleKeyDown);
        this.applyWidthSetting();
    }

    applyWidthSetting() {
        const recentFilesPrompt = document.querySelector('.prompt') as HTMLElement;
        if (recentFilesPrompt && this.plugin.settings.widthRecentList) {
            recentFilesPrompt.style.width = `${this.plugin.settings.widthRecentList}px`;
        }
    }

    onClose() {
        this.containerEl.removeEventListener('keydown', this.handleKeyDown);
        super.onClose();
        this.contentEl.empty();
    }

    private handleKeyDown = (evt: KeyboardEvent) => {
        // evt.isComposing determines whether the event is part of a key composition
        if (evt.key === 'Enter' && !evt.isComposing && evt.metaKey) {
            this.chooser.useSelectedItem(evt);
        }
    }

    getItemText(item: ParsedPath): string {
        return item.filename;
    }

    renderSuggestion(fuzzyMatch: FuzzyMatch<ParsedPath>, el: HTMLElement) {
        el.empty(); // Clear the existing content

        const suggestionContainer = document.createElement('div');
        suggestionContainer.classList.add('bibtex-integration-suggestions');

        const nameEl = document.createElement('div');
        nameEl.textContent = fuzzyMatch.item.filename;
        nameEl.classList.add('bibtex-integration-name');

        const dirEl = document.createElement('div');
        dirEl.classList.add('bibtex-integration-dir');
        dirEl.innerText = fuzzyMatch.item.dir;
        
        suggestionContainer.appendChild(nameEl);
        suggestionContainer.appendChild(dirEl);

        el.appendChild(suggestionContainer);
    }

    getItems(): Array<ParsedPath> {
        return this.files;
    }

    onChooseItem(selectedItem: ParsedPath, evt: MouseEvent | KeyboardEvent): void {
        const metaKeyPressed = evt.metaKey;
        openBdskDocument(
            this.app,
            joinPaths(this.plugin.settings.pdf_folder,this.bibEntry.year ?? "unknown"),
                selectedItem.base,
                this.bibEntry.citekey,
                this.files.findIndex(item => item === selectedItem) + 1, // we add +1 because of the indexing starting from 0
                metaKeyPressed
            );
    }
}