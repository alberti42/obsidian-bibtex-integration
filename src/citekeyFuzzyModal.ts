/* eslint-disable @typescript-eslint/no-inferrable-types */
import { FuzzyMatch, FuzzySuggestModal, Platform } from 'obsidian';

import BibtexIntegration from 'main';
import { BibTeXDict, BibTeXEntry } from 'types';

export class CitekeyFuzzyModal extends FuzzySuggestModal < unknown > {
	constructor(private plugin: BibtexIntegration, private bibtexEntries: BibTeXDict ) {
        super(plugin.app);
		this.setPlaceholder('Choose the paper to open...');
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

	openDocument(citekey: string, shouldCreateNewLeaf: boolean = true) {
        console.log(citekey);
		// const fileToOpen: TFile = this.app.vault.getAbstractFileByPath(filePath) as TFile;
		// if (!(fileToOpen instanceof TFile)) {
		// 	// Handle the error if the file is not found
		// 	const msg = 'File not found';
		// 	new Notice(msg + '.');
		// 	console.error(msg + ':', filePath);
		// }
		// let leaf = this.app.workspace.getMostRecentLeaf();
		// if (shouldCreateNewLeaf || (leaf && leaf.getViewState().pinned)) {
        //     leaf = this.app.workspace.getLeaf('tab');
		// }
		// if (leaf) {
		// 	leaf.openFile(fileToOpen);
		// } else {
		// 	console.error("Error in creating a leaf for the file to be opened:", filePath);
		// }
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
		return item.citekey;
	}

	renderSuggestion(fuzzyMatch: FuzzyMatch<BibTeXEntry>, el: HTMLElement) {
		el.empty(); // Clear the existing content

		const suggestionContainer = document.createElement('div');
		suggestionContainer.classList.add('dv-recent-files');

		const nameEl = document.createElement('div');
		nameEl.textContent = fuzzyMatch.item.citekey;
        nameEl.classList.add('bibtex-integration-citekey');

		const titleEl = document.createElement('div');
		titleEl.classList.add('bibtex-integration-title');

		if (fuzzyMatch.item.title) {
            titleEl.innerText = fuzzyMatch.item.title;
		}

		suggestionContainer.appendChild(nameEl);
		suggestionContainer.appendChild(titleEl);

		el.appendChild(suggestionContainer);
	}

	getItems(): Array<BibTeXEntry> {
		return Object.values(this.bibtexEntries);
	}

	onChooseItem(item: BibTeXEntry, evt: MouseEvent | KeyboardEvent): void {
		const metaKeyPressed = evt.metaKey;
		this.openDocument(item.citekey, metaKeyPressed);
	}
}