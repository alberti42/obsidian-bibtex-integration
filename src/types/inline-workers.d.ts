// inline-workers.d.ts

declare module 'inline-workers' {
    export function LoadWorker(workerName: string): Worker | null;
}