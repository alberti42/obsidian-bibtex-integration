// worker_manager.ts

export class WorkerManager<TResult = unknown, TInput = unknown> {
    private worker: Worker;
    private blocked: boolean;
    private options: WorkerManagerOptions;

    constructor(worker: Worker, options: WorkerManagerOptions) {
        this.worker = worker;
        this.blocked = false;
        this.options = { ...workerManagerDefaultOptions, ...options };
        
        // Listen for messages from the worker
        this.worker.onmessage = (event) => {
            

            // Handle response from the worker (e.g., resolve a promise)
            this.onWorkerMessage(event.data);
        };

        this.worker.onerror = (event) => {
            console.error("Worker error:", event);
            // Reject any pending promises or handle errors appropriately
        };
    }

    async post(message: TInput): Promise<TResult> {
        if (this.options.preventMultipleTasks && this.blocked) {
            throw new WorkerManagerBlocked();
        }

        this.blocked = true;
        return new Promise((resolve, reject) => {
            this.onWorkerMessage = resolve;  // Resolve when worker responds
            this.worker.postMessage(message);
        });
    }

    private onWorkerMessage: (result: TResult) => void = () => {};
}

export class WorkerManagerBlocked extends Error {
  constructor() {
    super('WorkerManager: discarded message because channel is blocked');
    Object.setPrototypeOf(this, WorkerManagerBlocked.prototype);
  }
}

export interface WorkerManagerOptions {
  /**
   * If true, treat the worker channel as blocking -- when the worker receives
   * a message, no other messages can be sent until the worker sends a message.
   * Messages which are sent during the blocking period will be discarded.
   */
  preventMultipleTasks: boolean;
}

const workerManagerDefaultOptions: WorkerManagerOptions = {
  preventMultipleTasks: false,
};
