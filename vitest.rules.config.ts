import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Security-rules tests. These run against the Firestore emulator, so they are
 * launched through `npm run test:rules`, which wraps vitest in
 * `firebase emulators:exec`. Running `vitest --config vitest.rules.config.ts`
 * on its own requires an emulator already listening on 127.0.0.1:8080.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false,
    reporters: ['default'],
  },
});
