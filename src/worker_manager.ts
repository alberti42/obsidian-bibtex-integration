// worker_manager.ts

export class WorkerManager<TResult = unknown, TInput = unknown> {
    private worker: Worker;
    private blocked: boolean;
    private options: WorkerManagerOptions;

    constructor(worker: Worker, options: WorkerManagerOptions) {
        this.worker = worker;
        this.blocked = false;
        this.options = { ...workerManagerDefaultOptions, ...options };
    }

    // Send a message to the worker and return a promise for the result
    async post(message: TInput): Promise<TResult> {
        if (this.options.preventMultipleTasks && this.blocked) {
            throw new BlockedWorkerError();
        }

        this.blocked = true;

        return new Promise((resolve, reject) => {
            // Store the resolve and reject callbacks in local variables
            const handleMessage = (event: MessageEvent) => {
                this.blocked = false;
                // we clean up because the process has finished its duty and it won't send other messages
                this.worker.removeEventListener('message', handleMessage);  // Clean up event listener
                resolve(event.data as TResult);  // Resolve with the worker's response
            };

            const handleError = (error: ErrorEvent) => {
                this.blocked = false;
                // we clean up because the process has finished its duty and it won't send other messages
                this.worker.removeEventListener('error', handleError);  // Clean up event listener
                reject(error);  // Reject the promise on error
            };

            // Attach the event listeners for message and error
            this.worker.addEventListener('message', handleMessage);
            this.worker.addEventListener('error', handleError);

            // Post the message to the worker
            this.worker.postMessage(message);
        });
    }

    // Handle worker errors by resetting the blocked flag and rejecting the promise
    private handleWorkerError(error: ErrorEvent) {
        console.error("Worker error:", error);
    }
}

class BlockedWorkerError extends Error {
    constructor() {
        super('WorkerManager: discarded message because channel is blocked');
        Object.setPrototypeOf(this, BlockedWorkerError.prototype);
    }
}

interface WorkerManagerOptions {
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
