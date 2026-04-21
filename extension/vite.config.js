import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import zipPack from 'vite-plugin-zip-pack';
import { resolve } from 'path';
import manifest from './manifest.config.js';
import { FLAGS } from './src/config/featureFlags.js';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    crx({ manifest }),
    zipPack({
      inDir: 'dist',
      outDir: 'release',
      outFileName: 'extension.zip',
    }),
  ],

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  base: './',

  define: {
    __ENABLE_ANALYTICS__: FLAGS.ENABLE_ANALYTICS,
    __DEBUG_MODE__: FLAGS.DEBUG_MODE,
  },

  build: {
    sourcemap: process.env.NODE_ENV !== 'production',
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
      },
    },
  },

  server: {
    cors: {
      origin: [/chrome-extension:\/\//],
    },
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
  },
});
