// bibtex_parser.worker.ts

import { ParserWorkerInput, WorkerExitStatus, WorkerErrorMsg, WorkerReply } from 'types';
import { SyntaxError } from "peggy";
import { parse, SyntaxError as SyntaxErrorFnc } from "./peggy.mjs"

function isSyntaxError(error: unknown): error is SyntaxError {
    return error instanceof SyntaxErrorFnc;
}

function max(a:number,b:number): number {
    if(a>b) return a
    else return b;
}

function min(a:number,b:number): number {
    if(a<b) return a
    else return b;
}

// Do not make this function async or otherwise errors are not detected properly
// If you need to make it async, follow https://stackoverflow.com/a/61409478/4216175
self.onmessage = function (event: MessageEvent) {
    const msg: ParserWorkerInput = event.data;
    const bibtexText = msg.bibtexText;
    const debug_parser = msg.options.debug_parser;

    try {
        const t2 = Date.now();
        const bibEntries = parse(bibtexText, {});
        const t3 = Date.now();
        if (debug_parser) {
            console.log("Bibtex file parsed in " + (t3 - t2) + " milliseconds");
            console.log(`Imported ${Object.keys(bibEntries).length} bibtex entries`);
        }
        const reply:WorkerReply = {
            exitStatus: WorkerExitStatus.Success,
            output:bibEntries,
            error: null,
        }
        self.postMessage(reply);
    } catch(error) {
        if(isSyntaxError(error)) {
            const start  = error.location.start;
            const end  = error.location.end;

            // Split the input into lines
            const lines = bibtexText.split("\n");

            // Determine the range of lines to show (3 lines above and 3 lines below)
            const startLine = max(start.line - 4, 0);
            const endLine = min(end.line + 3, lines.length - 1);

            console.error(`Syntax error between {line:${start.line},column:${start.column}} and {line:${end.line},column:${end.column}}`)

            // Show the lines around the error
            let selectedLines = "The offending lines in BibTex file are shown below:\n\n";
            for (let i = startLine; i <= endLine; i++) {
                
                // If it's the line with the start of the error, print the marker
                if (i === start.line - 1) {
                    selectedLines += "    " + " ".repeat(start.column - 1) + "↓ (Start of error)\n";
                }
                
                selectedLines += `${i + 1} | ${lines[i]}\n`;
                
                // If it's the line with the end of the error, print the marker
                if (i === end.line - 1) {
                    selectedLines += ("    " + " ".repeat(end.column - 1) + "↑ (End of error)\n");
                }
            }
            console.error(selectedLines);
            
            const errorInfo: WorkerErrorMsg = {
                errorName: error.name,
                errorMsg: `${error}`,
                errorStack: undefined,
            }

            const reply:WorkerReply = {
                exitStatus: WorkerExitStatus.Fail,
                output: [],
                error: errorInfo,
            }
            self.postMessage(reply);
        } else if(error instanceof Error) {
            console.error(`Error: ${error.name}`);
            console.error(`Message: ${error.message}`);
            console.error(`Stack: ${error.stack}`);

            const errorInfo: WorkerErrorMsg = {
                errorName: error.name,
                errorMsg: error.message,
                errorStack: error.stack
            }

            const reply:WorkerReply = {
                exitStatus: WorkerExitStatus.Fail,
                output: [],
                error: errorInfo,
            }
            self.postMessage(reply);
        } else {
            throw(error);
        }
    }
};

