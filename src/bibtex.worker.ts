// bibtex.worker.ts

import { BibtexParser } from 'bibtex_parser';
import registerPromiseWorker from 'promise-worker/register';
import { BibTeXDict, BibtexWorkerMsg } from 'types';

registerPromiseWorker(
    async (msg: BibtexWorkerMsg): Promise <BibTeXDict | null> => {
        switch (msg.cmd) {
            case 'parse':
                if (msg.bibtex_filepath !== '') {
                    const bibtexParser = new BibtexParser(msg.bibtex_filepath);
                    return await bibtexParser.parseBibtex();
                } else {
                    return null;    
                }
            default:
                return null;
        }

    },
);
