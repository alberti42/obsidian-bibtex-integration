// workers.d.ts

declare module 'inline-worker' {
  function workerScript(): string;
  export { workerScript };
}