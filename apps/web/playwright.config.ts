import { defineConfig, devices } from '@playwright/test';

const e2eEnv = {
  NEXT_PUBLIC_SITE_URL: 'http://localhost:3003',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3003',
  NEXT_PUBLIC_SERVER_URL: 'http://localhost:3000',
  NEXT_PUBLIC_GOOGLE_AUTH_ENABLED: 'false',
};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: e2eEnv.NEXT_PUBLIC_APP_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'bun run dev',
    cwd: '.',
    url: e2eEnv.NEXT_PUBLIC_APP_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      ...e2eEnv,
    },
  },
  testMatch: '**/*.spec.ts',
});
