// worker.worker.js

import { BibtexParser } from 'bibtex_parser';
import registerPromiseWorker from 'promise-worker/register';

registerPromiseWorker(
  (msg: {bibtexParser: BibtexParser }): string[] => {
    return ["d","dfgf"]
  },
);
