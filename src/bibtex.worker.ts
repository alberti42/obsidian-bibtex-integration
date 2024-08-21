// bibtex.worker.ts

import { parseBibtex } from 'bibtex_parser';
import registerPromiseWorker from 'promise-worker/register';
import { ParserWorkerInputs, ParserWorkerReply } from 'types';

registerPromiseWorker(
    async (bibtexData:ParserWorkerInputs): Promise <ParserWorkerReply> => {
        return await parseBibtex(bibtexData);
    },
);
