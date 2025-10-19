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
        copyFileSync('styles/theme-default.css', 'dist/styles/theme-default.css');
        copyFileSync('styles/theme-magical.css', 'dist/styles/theme-magical.css');
        copyFileSync('styles/theme-dark.css', 'dist/styles/theme-dark.css');
        copyFileSync('styles/animations.css', 'dist/styles/animations.css');
        
        if (!existsSync('dist/assets/icons')) {
          mkdirSync('dist/assets/icons', { recursive: true });
        }
        copyFileSync('assets/icons/icon-16.png', 'dist/assets/icons/icon-16.png');
        copyFileSync('assets/icons/icon-48.png', 'dist/assets/icons/icon-48.png');
        copyFileSync('assets/icons/icon-128.png', 'dist/assets/icons/icon-128.png');
        
        if (existsSync('assets/meeple-orange.png')) {
          copyFileSync('assets/meeple-orange.png', 'dist/assets/meeple-orange.png');
        }
      }
    }
  ]
});