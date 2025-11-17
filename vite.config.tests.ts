import { defineConfig } from "vite";
import { default as terser } from '@rollup/plugin-terser';
import dts from 'vite-plugin-dts';
import { resolve, relative, extname } from 'path';
import { glob, globSync } from 'glob';
import { fileURLToPath } from "url";

export default defineConfig({
    server: {
        sourcemapIgnoreList(sourcePath, sourcemapPath) {
           return sourcePath.includes('tests')
        }
    },
    build: {
        lib: {
            entry: ['src/tests/tests.ts'],
            formats: ['es'],
            name: 'iife',
        },
        // minify: false,
        rollupOptions: {
            input: Object.fromEntries(
                globSync('./src/**/*tests.{js,ts,jsx,tsx}').map(file => [
                    // This removes `src/` as well as the file extension from each
                    // file, so e.g. src/nested/foo.js becomes nested/foo
                    relative(
                        'src',
                        file.slice(0, file.length - extname(file).length)
                    ),
                    // This expands the relative paths to absolute paths, so e.g.
                    // src/nested/foo becomes /project/src/nested/foo.js
                    fileURLToPath(new URL(file, import.meta.url))
                ])
            ),
            output: {
                entryFileNames: '[name].js',
                format: 'es',
                dir: 'test-runner/libs',
                inlineDynamicImports: false,
            }
        }
    },
    // plugins: [dts()]
});