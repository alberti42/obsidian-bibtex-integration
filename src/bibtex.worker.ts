// bibtex.worker.ts

import { parseBibtex } from 'bibtex_parser';
import registerPromiseWorker from 'promise-worker/register';
import { ParserWorkerReply } from 'types';

registerPromiseWorker(
    async (bibtexData:string): Promise <ParserWorkerReply> => {
        return await parseBibtex(bibtexData);
    },
);
