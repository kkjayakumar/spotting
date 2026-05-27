/** Shared Playwright E2E fixtures (must match apps/api/scripts/e2e-seed.ts). */
import { E2E_CAPTURE_KEY, E2E_ENV } from "./env";

export const E2E_FIXTURES = {
  email: "e2e@spotting.test",
  password: "e2e-test-password",
  captureKey: E2E_CAPTURE_KEY,
  apiUrl: E2E_ENV.NEXT_PUBLIC_SERVER_URL.replace(/\/$/, ""),
  appUrl: E2E_ENV.NEXT_PUBLIC_APP_URL.replace(/\/$/, ""),
} as const;
