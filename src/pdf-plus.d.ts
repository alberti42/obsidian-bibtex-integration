// pdf-plug.d.ts

import { Plugin, TFile } from "obsidian";

declare module "obsidian" {
    interface PdfPlusPlugin extends Plugin {
        lib: PDFPlusLib;
    }

    class PDFPlusLib {
        app: App;
        getExternalPDFUrl(file: TFile): Promise<string | null>;
    }
}
