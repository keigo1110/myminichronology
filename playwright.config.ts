import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  outputDir: process.env.PLAYWRIGHT_OUTPUT_DIR ?? '/tmp/minikuro-playwright',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    locale: 'ja-JP',
    colorScheme: 'light',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { browserName: 'chromium', channel: process.env.PLAYWRIGHT_CHANNEL, viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { browserName: 'chromium', channel: process.env.PLAYWRIGHT_CHANNEL, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: 'firefox', use: { browserName: 'firefox', viewport: { width: 1440, height: 900 } } },
    { name: 'webkit', use: { browserName: 'webkit', viewport: { width: 1440, height: 900 } } },
    { name: 'mobile-webkit', use: { browserName: 'webkit', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: 'npm run start -- --hostname 127.0.0.1 --port 3000',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
