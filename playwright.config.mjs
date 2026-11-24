import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  use: { baseURL: 'http://127.0.0.1:4321', trace: 'retain-on-failure' },
  reporter: process.env.CI ? 'github' : 'list',
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4321',
    url: 'http://127.0.0.1:4321/tech-guides-site/',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
