import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://macho-ya-mwananchi-client.onrender.com';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,        // sequential — Render free tier handles one session at a time cleanly
  retries: process.env.CI ? 2 : 0,
  timeout: 60_000,             // each test gets 60s (Render cold start allowance)
  expect: { timeout: 15_000 },

  use: {
    baseURL:           BASE_URL,
    headless:          true,
    viewport:          { width: 1280, height: 800 },
    actionTimeout:     25_000,   // ward pages fetch data async — needs headroom
    navigationTimeout: 30_000,
    trace:             'on-first-retry',
    screenshot:        'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list']],
});
