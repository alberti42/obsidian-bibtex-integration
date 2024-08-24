// esbuild-plugin-inline-worker.mjs

// Author: Andrea Alberti, 2024

import esbuild from "esbuild";
import fs from 'fs/promises';
import path from 'path';
import { Buffer } from 'buffer';
import chokidar from 'chokidar';

const default_options = {
    production: false,
    srcDir: '.',
    workerExtension: '.worker.ts',
    watchChangesInWorkers: true, 
    onWorkersRebuild: async () => {},
};

// Custom esbuild plugin to generate worker code dynamically
const inline_workers_plugin = (user_options = {}) => ({
    name: 'inline_workers',
    setup(build) {
        const options = { ...default_options, ...user_options };
        let workerFiles = [];
        let dependencies = new Set();

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
            workerFiles = await findWorkerFiles(options.srcDir); // Track the worker files
            const workerDict = {};
            dependencies.clear(); // Clear the dependencies before rebuilding

            for (let workerFile of workerFiles) {
                const workerName = path.basename(workerFile, options.workerExtension); // Get the worker name
                
                const result = await esbuild.build({
                    entryPoints: [workerFile],
                    bundle: true,
                    metafile: true,  // Get the metadata for dependencies
                    write: false,
                    platform: 'browser',
                    format: 'iife',
                    minify: options.production,
                });

                // Collect dependencies from the metadata
                const inputs = result.metafile.inputs;
                Object.keys(inputs).forEach((input) => {
                    dependencies.add(path.resolve(input));  // Track full path to dependencies
                });
                dependencies.add(path.resolve(workerFile));

                const workerCode = result.outputFiles[0].text;
                const workerCodeBase64 = Buffer.from(workerCode).toString('base64');
                workerDict[workerName] = workerCodeBase64; // Add worker to the dictionary
            }

            return workerDict;
        };

        // Mark the virtual module for 'inline-workers' so esbuild knows how to handle it
        build.onResolve({ filter: /^inline-workers$/ }, () => {
            return { path: 'inline-workers', namespace: 'inline-worker' };
        });

        // Dynamically generate 'inline-workers' content when it's loaded
        build.onLoad({ filter: /^inline-workers$/, namespace: 'inline-worker' }, async () => {
            // Find and build worker files
            const workerDict = await buildWorkers();

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

            return { contents: loadWorkerCode, loader: 'ts' };
        });

        // Ensure worker files and their dependencies are watched in watch mode
        build.onEnd(() => {
            let currentWatcher = null; // Global reference to the current watcher

            if (options.watchChangesInWorkers && workerFiles.length > 0) {
                // Clean up previous watcher if it exists
                if (currentWatcher) {
                    currentWatcher.close();
                    currentWatcher = null;
                }

                // Use chokidar to watch the worker files and dependencies for changes
                currentWatcher = chokidar.watch(Array.from(dependencies), { persistent: true });

                currentWatcher.on('change', async (filePath) => {
                    console.log(`[watch] build started (change: "${filePath}")`);
                    // Trigger a rebuild when a worker file or dependency changes
                    await buildWorkers(); // Rebuild workers
                    await options.onWorkersRebuild();
                    console.log(`[watch] build finished`);
                    currentWatcher.close();
                    currentWatcher = null;
                });

                // Stop watching when the process exits
                process.on('SIGINT', () => {
                    if (currentWatcher) {
                        currentWatcher.close();
                    }
                    process.exit();
                });
            }
        });
    },
});

export { inline_workers_plugin as default };
