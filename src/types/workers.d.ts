// workers.d.ts

declare module 'inline-worker' {
    export function LoadWorker(workerName:string): string;
}

declare module 'workers' {
    export function LoadWorker(workerName: string): Worker | null;
}