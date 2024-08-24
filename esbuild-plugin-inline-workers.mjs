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
    virtualModuleName: 'workers', // Virtual module name, no file needed
};

// Custom esbuild plugin to generate worker code dynamically
const inline_workers_plugin = (user_options = {}) => ({
    name: 'inline-workers',
    setup(build) {
        const options = { ...default_options, ...user_options };

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

        // Mark the virtual module for 'workers' so esbuild knows how to handle it
        build.onResolve({ filter: /^workers$/ }, () => {
            return { path: 'workers', namespace: 'inline-worker' };
        });

        // Dynamically generate 'workers' content when it's loaded
        build.onLoad({ filter: /^workers$/, namespace: 'inline-worker' }, async () => {
            // Find and build worker files
            const workerDict = await buildWorkers(); // Get the worker dictionary

            // Generate the worker dictionary code
            let workerDictCode = `const _worker_dict = {};\n`;
            for (const [workerName, workerCodeBase64] of Object.entries(workerDict)) {
                workerDictCode += `_worker_dict['${workerName}'] = '${workerCodeBase64}';\n`;
            }

            // Generate the LoadWorker function code
            const loadWorkerCode = `
export function LoadWorker(workerName) {
    const workerScriptBase64 = _worker_dict[workerName];
    if (!workerScriptBase64) return null;
    const workerScriptDecoded = atob(workerScriptBase64);
    const workerBlob = new Blob([workerScriptDecoded], { type: 'application/javascript' });
    const workerURL = URL.createObjectURL(workerBlob);
    return new Worker(workerURL);
}

${workerDictCode}
`;
            console.log(loadWorkerCode);
            return { contents: loadWorkerCode, loader: 'ts' };
        });
    },
});

export { inline_workers_plugin as default };
