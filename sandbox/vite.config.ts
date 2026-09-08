import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// Deliberately independent of the game's Vinext, hosting, database and AI setup.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  envDir: false,
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('..', import.meta.url)) } },
  server: { host: '127.0.0.1', port: 4317, strictPort: true },
  build: { outDir: '../outputs/sandbox', emptyOutDir: false },
});
