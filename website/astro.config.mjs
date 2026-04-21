import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://youzen.app',
  trailingSlash: 'never',
  vite: {
    plugins: [tailwindcss()],
  },
});
