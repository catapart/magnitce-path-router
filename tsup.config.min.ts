import { defineConfig, esbuildOptions } from 'tsup';
export default defineConfig({
    outExtension()
    {
        return {
            js: `.min.js`,
        }
    },
    noExternal: [/(.*)/],
    splitting: false
})