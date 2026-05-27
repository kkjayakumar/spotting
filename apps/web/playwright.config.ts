import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";

import { E2E_ENV, PLAYWRIGHT_REUSE_SERVER } from "./e2e/env";

const repoRoot = resolve(__dirname, "../..");

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: E2E_ENV.NEXT_PUBLIC_APP_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "npm run dev -w @spotting/api",
      cwd: repoRoot,
      url: "http://localhost:3000/healthz",
      reuseExistingServer: PLAYWRIGHT_REUSE_SERVER,
      timeout: 120_000,
      env: {
        ...process.env,
        ...E2E_ENV,
      },
    },
    {
      command: "npm run dev",
      cwd: ".",
      url: E2E_ENV.NEXT_PUBLIC_APP_URL,
      reuseExistingServer: PLAYWRIGHT_REUSE_SERVER,
      timeout: 120_000,
      env: {
        ...process.env,
        ...E2E_ENV,
      },
    },
  ],
  testMatch: "**/*.spec.ts",
});
