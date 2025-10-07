import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'content/main.js'),
        background: resolve(__dirname, 'background/service-worker.js'),
        popup: resolve(__dirname, 'popup/popup.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
  plugins: [
    {
      name: 'copy-assets',
      closeBundle() {
        copyFileSync('manifest.json', 'dist/manifest.json');
        
        if (!existsSync('dist/styles')) {
          mkdirSync('dist/styles', { recursive: true });
        }
        copyFileSync('styles/content.css', 'dist/styles/content.css');
      }
    }
  ]
});
