import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import webWorkerLoader from 'rollup-plugin-web-worker-loader';
import { terser } from 'rollup-plugin-terser';

const prod = process.env.NODE_ENV === 'production';

export default {
  input: 'src/main.ts',
  output: {
    dir: 'dist',  // Set a proper output directory
    sourcemap: prod ? false : 'inline',  // Sourcemaps only in development
    format: 'cjs',  // CommonJS for Obsidian
    exports: 'default',
  },
  external: ['obsidian', 'path', 'fs', 'util', 'events', 'stream', 'os'],
  plugins: [
    typescript(),
    nodeResolve({ browser: true }),
    commonjs(),
    json(),
    webWorkerLoader({
      targetPlatform: 'browser',
      extensions: ['.ts'],
      sourcemap: !prod,  // Preserve source maps in development
    }),
    prod && terser(),  // Minify for production
  ].filter(Boolean),  // Ensure no false values are in the plugins array
};
