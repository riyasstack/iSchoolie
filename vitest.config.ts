import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/** Unit tests: pure domain logic only (no network, no emulator). */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    reporters: ['default'],
  },
});
