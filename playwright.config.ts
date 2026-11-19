import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests.
 *
 * The suite drives the real application against the Firebase Emulator Suite.
 * Start the emulators first (`npm run emulators`) and seed the demo accounts
 * (`npm run seed`), then run `npm run test:e2e`.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npm run dev -- --port 3000',
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: true,
        timeout: 180_000,
        env: {
          NEXT_PUBLIC_USE_FIREBASE_EMULATORS: 'true',
          NEXT_PUBLIC_FIREBASE_API_KEY: 'demo-api-key',
          NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo-ischoolie.firebaseapp.com',
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-ischoolie',
          NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'demo-ischoolie.appspot.com',
          NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
          NEXT_PUBLIC_FIREBASE_APP_ID: '1:000000000000:web:demo',
          NEXT_PUBLIC_APP_ORIGIN: 'http://127.0.0.1:3000',
        },
      },
});
