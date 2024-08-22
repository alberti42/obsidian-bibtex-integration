import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import webWorkerLoader from 'rollup-plugin-web-worker-loader';
import { terser } from 'rollup-plugin-terser';
import copy from 'rollup-plugin-copy';  // Import the copy plugin
import replace from '@rollup/plugin-replace';
import json from '@rollup/plugin-json'; // Necessary for 

const prod = process.env.NODE_ENV === 'production';

export default {
  input: 'src/main.ts',
  output: {
    dir: 'dist',
    sourcemap: prod ? false : 'inline',
    format: 'cjs',
    exports: 'default',
  },
  external: ['obsidian', 'path', 'fs', 'util', 'events', 'stream', 'os'],
  plugins: [
    /**
     * Chokidar hacks to get working with platform-general Electron build.
     *
     * HACK: Manually replace fsevents import. This is only available on OS X,
     * and we need to make a platform-general build here.
     */
    replace({
      preventAssignment: true, // Set preventAssignment to true
      delimiters: ['', ''],
      include: "node_modules/chokidar/**/*.js",

      "require('fsevents')": "null",
      "require('fs')": "require('original-fs')",
    }),
    typescript(),
    json(),
    nodeResolve({ browser: true }),
    commonjs({ ignore: ['original-fs'] }),
    webWorkerLoader({
      targetPlatform: 'browser',
      extensions: ['.ts'],
      sourcemap: !prod,
    }),
    prod && terser(),
    copy({
      targets: [
        { src: 'styles/styles.css', dest: 'dist/', rename: 'styles.css' },  // Copy file as dist/styles.css
        { src: 'manifest.json', dest: 'dist/' },  // Copy manifest.json to dist folder
      ],
      verbose: false,
    }),
  ].filter(Boolean),
};
