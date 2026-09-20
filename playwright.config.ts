import { defineConfig, devices } from '@playwright/test';

const host = '127.0.0.1';
const port = 4322;
const baseURL = `http://${host}:${port}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: 2,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL, trace: 'retain-on-failure', channel: 'chromium' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `bun run preview --host ${host} --port ${port} --ignore-lock`,
    // Keep Astro in the foreground when a coding-agent environment is detected.
    env: { ASTRO_PREVIEW_BACKGROUND: '1' },
    url: baseURL,
    reuseExistingServer: false,
  },
});
