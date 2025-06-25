import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // ...other options
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'apps/web'),
    },
  },
});
