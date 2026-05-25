import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/dazi/' : './',
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
