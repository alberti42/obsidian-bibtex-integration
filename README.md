# Obsidian Bibdesk Integration

The plugin provides integration of the macOS [BibDesk](https://en.wikipedia.org/wiki/BibDesk) application with the [PDF++](https://github.com/RyotaUshio/obsidian-pdf-plus) plugin for Obsidian. The plugin relies on a BibTex file for the paper library. 

The plugin is able to parse the `bdsk-file-XYZ` fields created by BibDesks in the BibTex library. The strength of BibDesks `bdsk-file-XYZ` links is that they are macOS bookmarks that will resolve to the correct file even if the file is later renamed or moved.

The plugin does not require the paper library to be stored in the vault. This is especially important for those who have a large paper library of several GB and do not intend to use space in Obsidian's vault.

![setting_screenshot](docs/images/setting_screenshot.jpg)

![setting_screenshot](docs/images/suggestion_menu_screenshot.jpg)

## Installation

From command line:

1. Clone the repository to a local folder: `https://github.com/alberti42/obsidian-bibtex-integration.git`.
2. Install the `node.js` packages: `npm install`
3. Generate the parser for parsing BibTex files:  `npm run grammar`
4. Using Swift compiler, build the utility resolving macOS bookmarks: `npm run bookmark_resolver`. This step requires you to have `swiftc` available from command line; see Apple Xcode instrutions how to make it available.
5. Transpile the plugin: `npm run build`
6. Check that in the subfolder `dist` the following files have been created: `styles.css
bookmark_resolver`, `main.js`, `manifest.json`
7. Create in your vault the folder for the plugin: `mkdir -p <REPLACE_WITH_YOUR_VAULT_FOLDER/.obsidian/plugins/bibtex-integration`
8. Copy the files listed at point 6. to the folder created at point 7. Alterantively, create symbolic links (e.g., using `ln -s ...`) if you plan to fork the project and do further development, where you need to repeat the steps above often.

## Donations

I would be grateful for any donation to support the development of this plugin.

[<img src="docs/images/buy_me_coffee.png" width=300 alt="Buy Me a Coffee QR Code"/>](https://buymeacoffee.com/alberti)

## Author

- **Author:** Andrea Alberti
- **GitHub Profile:** [alberti42](https://github.com/alberti42)
- **Donations:** [![Buy Me a Coffee](https://img.shields.io/badge/Donate-Buy%20Me%20a%20Coffee-orange)](https://buymeacoffee.com/alberti)

Feel free to contribute to the development of this plugin or report any issues in the [GitHub repository](https://github.com/alberti42/obsidian-plugins-annotations/issues).
