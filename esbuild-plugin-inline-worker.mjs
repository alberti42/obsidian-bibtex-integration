// esbuild-plugin-inline-worker.mjs

// Author: Andrea Alberti, 2024

import esbuild from "esbuild";
import fs from 'fs/promises';
import path from 'path';
import { Buffer } from 'buffer';

const default_options = {
    production: false,
    srcDir: '.',
    workerExtension: '.worker.ts',
    fileBundlingWorkers: 'workers.ts',
}

// Custom esbuild plugin to inject worker code
const inline_web_worker = (user_options = {}) => ({
    name: 'inline_web_worker',
    setup(build) {
        const options = {...default_options,user_options};
        console.log(RegExp(`${path.join(options.srcDir,options.fileBundlingWorkers)}$`));
        // Step 1: Find and process all .worker.ts files
        const findWorkerFiles = async (dir) => {
            let files = await fs.readdir(dir, { withFileTypes: true });
            let workerFiles = [];

            for (let file of files) {
                const fullPath = path.join(dir, file.name);
                if (file.isDirectory()) {
                    workerFiles = workerFiles.concat(await findWorkerFiles(fullPath)); // Recurse into subdirectories
                } else if (file.name.endsWith(options.workerExtension)) {
                    workerFiles.push(fullPath); // Found a worker file
                }
            }
            return workerFiles;
        };

        const buildWorkers = async () => {
            const workerFiles = await findWorkerFiles(options.srcDir);
            const workerDict = {};

            for (let workerFile of workerFiles) {
                const workerName = path.basename(workerFile, options.workerExtension); // Get the worker name (e.g., 'bibtex' from 'bibtex.worker.ts')
                
                const result = await esbuild.build({
                    entryPoints: [workerFile],
                    bundle: true,
                    write: false,
                    platform: 'browser',
                    format: 'iife',
                    minify: options.production,
                });

                const workerCode = result.outputFiles[0].text;
                const workerCodeBase64 = Buffer.from(workerCode).toString('base64');
                workerDict[workerName] = workerCodeBase64; // Add worker to the dictionary
            }

            return workerDict;
        };

        build.onLoad({ filter: /main.ts$/ }, async (args) => {
            console.log("TRUGGE");

            // Find and build worker files
            const workerDict = await buildWorkers(); // Get the worker dictionary

            // Generate the worker dictionary code
            let workerDictCode = `\nconst _worker_dict = {};\n`;
            for (const [workerName, workerCodeBase64] of Object.entries(workerDict)) {
                workerDictCode += `\n_worker_dict['${workerName}'] = '${workerCodeBase64}';\n`;
            }

            // Generate the LoadWorker function code
            const loadWorkerCode = `

function LoadWorker(workerName) {
    const workerScriptBase64 = _worker_dict[workerName];
    if (!workerScriptBase64) return null;
    const workerScriptDecoded = atob(workerScriptBase64);
    const workerBlob = new Blob([workerScriptDecoded], { type: 'application/javascript' });
    const workerURL = URL.createObjectURL(workerBlob);
    return new Worker(workerURL);
}
`;

            // Read the main.ts content
            let source = await fs.readFile(args.path, 'utf8');

            // Combine worker dictionary code and loader function
            const workerBlobCode = loadWorkerCode + workerDictCode;

            // Replace placeholder with the generated worker code
            source = source.replace(/(?<=\/\/ AUTOMATICALLY GENERATED CODE FOR WORKERS[\n\r]*)[\s\S]*/, workerBlobCode);
            console.log(source);

            return { contents: source, loader: 'ts' };
        });
    },
});

export { inline_web_worker as default };
