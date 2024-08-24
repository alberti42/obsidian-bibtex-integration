// bibtex.worker.ts

import { parseBibtex } from './bibtex_parser';
import { ParserWorkerInputs, ParserWorkerReply } from 'types';

// Worker code
self.onmessage = async function (event: MessageEvent) {
    const msg: ParserWorkerInputs = event.data;
    try {
        const parsedData: ParserWorkerReply = await parseBibtex(msg);
        self.postMessage(parsedData);
    } catch (error) {
        self.postMessage({ error });
    }
};

