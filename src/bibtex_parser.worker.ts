// bibtex_parser.worker.ts

import { ParserWorkerInputs } from 'types';
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
    const msg: ParserWorkerInputs = event.data;
    const bibtexData = msg.bibtex_data;
    const debug_parser = msg.options.debug_parser;
    
    try {
        const t2 = Date.now();
        const parsedData = parse(bibtexData + "\n\nicnodccond", {});
        const t3 = Date.now();
        if (debug_parser) {
            console.log("Bibtex file parsed in " + (t3 - t2) + " milliseconds");
            console.log(`Imported ${Object.keys(parsedData).length} bibtex entries`);
        }
        self.postMessage(parsedData);
    } catch(error) {
        if(isSyntaxError(error)) {
            const start  = error.location.start;
            const end  = error.location.end;

            // Split the input into lines
            const lines = bibtexData.split("\n");

            // Determine the range of lines to show (3 lines above and 3 lines below)
            const startLine = max(start.line - 4, 0);
            const endLine = min(end.line + 3, lines.length - 1);
            console.log({dsfd:start.line - 4,startLine,endLine,sd:end.line + 3});

            console.error(`Syntax error between {line:${start.line},column:${start.column}} and {line:${end.line},column:${end.column}}`)

            // Show the lines around the error
            for (let i = startLine; i <= endLine; i++) {
                const lineContent = lines[i];
                console.log(`${i + 1} | ${lineContent}`);
                
                // If it's the line with the start of the error, print the marker
                if (i === start.line - 1) {
                    console.log("    " + " ".repeat(start.column - 1) + "^ (Start of Error)");
                }
                
                // If it's the line with the end of the error, print the marker
                if (i === end.line - 1) {
                    console.log("    " + " ".repeat(end.column - 1) + "^ (End of Error)");
                }
            }
            console.error(error);
        } else if(error instanceof Error) {
            console.error(`Error: ${error.name}`);
            console.error(`Message: ${error.message}`);
            console.error(`Stack: ${error.stack}`);
        } else {
            console.error(error);
        }
    }
};

