// workers.d.ts

declare module 'inline-worker' {
    export function LoadWorker(workerName:string): string;
    export function workerScript(): string;
}