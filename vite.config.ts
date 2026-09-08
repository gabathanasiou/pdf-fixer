import { defineConfig } from 'vite'

export default defineConfig({
  // relative base so the app works on GitHub Pages subpaths like /pdf-fixer/
  base: './',
  build: {
    target: 'es2022',
  },
  // expose dev/preview on the LAN so the app can be tested from phones/tablets
  server: {
    host: true,
  },
  preview: {
    host: true,
  },
  // let Vite serve mupdf's raw ESM from node_modules in dev (top-level await + runtime wasm fetch)
  optimizeDeps: {
    exclude: ['mupdf'],
  },
})