// inline-workers.d.ts

declare module 'workers' {
    export function LoadWorker(workerName: string): Worker | null;
}