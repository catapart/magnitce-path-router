import { defineConfig } from "vite";
import { default as terser } from '@rollup/plugin-terser';
import dts from 'vite-plugin-dts';

export default defineConfig({
    build: {
        lib: {
            entry: ['src/path-router.ts'],
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
                    entryFileNames: 'path-router.js',
                    format: 'es',
                },
                {
                    dir: 'dist',
                    entryFileNames: 'path-router.min.js',
                    format: 'es',
                    plugins: [terser()]
                },
                {
                    dir: 'dist',
                    name: 'path-router.umd.js',
                    entryFileNames: 'path-router.umd.js',
                    format: 'umd',
                },
                {
                    dir: 'dist',
                    entryFileNames: 'cpath-router.umd.min.js',
                    name: 'path-router.umd.min.js',
                    format: 'umd',
                    plugins: [terser()]
                }
            ]
        }
    },
    plugins: [dts({exclude: "**/*.test.ts"})]
});