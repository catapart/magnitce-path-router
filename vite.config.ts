import { defineConfig } from "vite";
import { default as terser } from '@rollup/plugin-terser';
import dts from 'vite-plugin-dts';

export default defineConfig({
    build: {
        lib: {
            entry: ['src/code-example.ts'],
        },
        minify: false,
        rollupOptions: {
            external: [
                '**/*tests.ts',
                '**/*tests.js',
            ],
            output: [
                {
                    dir: 'dist',
                    entryFileNames: 'code-example.js',
                    format: 'es',
                },
                {
                    dir: 'dist',
                    entryFileNames: 'code-example.min.js',
                    format: 'es',
                    plugins: [terser()]
                },
                {
                    dir: 'dist',
                    name: 'code-example.umd.js',
                    entryFileNames: 'code-example.umd.js',
                    format: 'umd',
                },
                {
                    dir: 'dist',
                    entryFileNames: 'code-example.umd.min.js',
                    name: 'code-example.umd.min.js',
                    format: 'umd',
                    plugins: [terser()]
                }
            ]
        }
    },
    plugins: [dts({exclude: "**/*.test.ts"})]
});