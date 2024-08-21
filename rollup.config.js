import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import webWorkerLoader from 'rollup-plugin-web-worker-loader';
import { terser } from 'rollup-plugin-terser';
import copy from 'rollup-plugin-copy';  // Import the copy plugin

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
        { src: 'styles/styles.css', dest: 'dist/', rename: 'styles.css' },  // Copy file as dist/styles.css
        { src: 'manifest.json', dest: 'dist/' },  // Copy manifest.json to dist folder
      ],
      copyOnce: true,
      verbose: true,
    }),
  ].filter(Boolean),
};
