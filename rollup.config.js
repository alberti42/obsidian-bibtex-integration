import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import webWorkerLoader from 'rollup-plugin-web-worker-loader';
import { terser } from 'rollup-plugin-terser';
import copy from 'rollup-plugin-copy';

const prod = process.env.NODE_ENV === 'production';

export default {
  input: 'src/main.ts',
  output: {
    dir: 'dist',
    sourcemap: prod ? false : 'inline',
    format: 'cjs',  // Use CommonJS for Obsidian/Electron
    exports: 'default',
    globals: {  // Ensure external modules are treated correctly
      fs: 'require("fs")',  // In Electron, fs is available natively
      path: 'require("path")',
      os: 'require("os")',
    },
  },
  external: ['obsidian', 'path', 'fs', 'util', 'events', 'stream', 'os'],
  plugins: [
    typescript(),
    nodeResolve({ browser: true }),
    commonjs(),
    webWorkerLoader({
      targetPlatform: 'browser',
      extensions: ['.ts'],
      sourcemap: !prod,
    }),
    prod && terser(),
    copy({
      targets: [
        { src: 'styles/styles.css', dest: 'dist/', rename: 'styles.css' },
        { src: 'manifest.json', dest: 'dist/' },
      ],
      copyOnce: true,
      verbose: true,
    }),
  ].filter(Boolean),
};
