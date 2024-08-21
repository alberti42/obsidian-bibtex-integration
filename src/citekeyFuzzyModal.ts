/* eslint-disable @typescript-eslint/no-inferrable-types */
import { App, FuzzyMatch, FuzzySuggestModal, TFile, Notice, Platform } from 'obsidian';

import RecentFilesPlugin from 'main';

import { DEFAULT_SETTINGS } from 'defaults';

export class CitekeyFuzzyModal extends FuzzySuggestModal < unknown > {
	constructor(app: App, private plugin: RecentFilesPlugin, private files: Array<unknown> ) {
		super(app);
		this.setPlaceholder(`Search recently files...`);
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

	openNote(filePath: string, shouldCreateNewLeaf: boolean = true) {
		const fileToOpen: TFile = this.app.vault.getAbstractFileByPath(filePath) as TFile;
		if (!(fileToOpen instanceof TFile)) {
			// Handle the error if the file is not found
			const msg = 'File not found';
			new Notice(msg + '.');
			console.error(msg + ':', filePath);
		}
		const leaf = this.app.workspace.getMostRecentLeaf();
		if (shouldCreateNewLeaf || (leaf && leaf.getViewState().pinned)) {
            // default_behavior = MetaKeyBehavior.MetaKeyBehavior.WINDOW;
			// leaf = this.app.workspace.getLeaf(default_behavior);
		}
		if (leaf) {
			leaf.openFile(fileToOpen);
		} else {
			console.error("Error in creating a leaf for the file to be opened:", filePath);
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

	getItemText(item: RecentFile): string {
		return item.Name;
	}

	renderSuggestion(item: FuzzyMatch < RecentFile > , el: HTMLElement) {
		el.empty(); // Clear the existing content

		const suggestionContainer = document.createElement('div');
		suggestionContainer.classList.add('dv-recent-files');

		const nameEl = document.createElement('div');
		nameEl.textContent = item.item.Name;
		nameEl.classList.add('dv-recent-name');

		const tagsEl = document.createElement('div');
		tagsEl.classList.add('dv-recent-tags');

		if (item.item.Tags) {
			const tagsArray = item.item.Tags;
			tagsArray.forEach(tag => {
				if (tag.startsWith('#')) {
					tag = tag.slice(1); // Remove the first '#' character if it exists
				}

				const tagContainer = document.createElement('div');
				
				const hashtagEl = document.createElement('span');
				hashtagEl.classList.add('cm-formatting', 'cm-formatting-hashtag', 'cm-hashtag', 'cm-hashtag-begin', 'cm-meta', 'cm-tag-Computer');
				hashtagEl.textContent = '#';

				const tagEl = document.createElement('span');
				tagEl.textContent = tag;
				tagEl.classList.add('cm-hashtag', 'cm-meta', 'cm-hashtag-end');

				tagContainer.appendChild(hashtagEl);
				tagContainer.appendChild(tagEl);
				tagsEl.appendChild(tagContainer);
			});
		}

		suggestionContainer.appendChild(nameEl);
		suggestionContainer.appendChild(tagsEl);

		el.appendChild(suggestionContainer);
	}

	getItems(): Array<RecentFile> {
		return this.files;
	}

	onChooseItem(item: RecentFile, evt: MouseEvent | KeyboardEvent): void {
		const metaKeyPressed = evt.metaKey;
		this.openNote(item.Path, metaKeyPressed);
	}
}