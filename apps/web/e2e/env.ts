/** Shared Playwright E2E environment (keep in sync with playwright.config.ts). */
export const E2E_ENV = {
  NODE_ENV: "development",
  DATABASE_URL:
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5433/spotting?schema=public",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3003",
  NEXT_PUBLIC_APP_URL: "http://localhost:3003",
  NEXT_PUBLIC_SERVER_URL: "http://localhost:3000",
  NEXT_PUBLIC_GOOGLE_AUTH_ENABLED: "false",
  SPOTTING_API_INTERNAL_URL: "http://127.0.0.1:3000",
  CORS_ORIGINS: "http://localhost:3003",
  API_PORT: "3000",
  SPOTTING_ACCEPT_LEGACY_CRK_KEYS: "true",
} as const;

/** Reuse dev servers locally by default; CI and prelaunch pass PLAYWRIGHT_REUSE_SERVER=false. */
export const PLAYWRIGHT_REUSE_SERVER =
  process.env.PLAYWRIGHT_REUSE_SERVER === "true"
    ? true
    : process.env.PLAYWRIGHT_REUSE_SERVER === "false"
      ? false
      : !process.env.CI;

export const E2E_CAPTURE_KEY = "spk_live_e2e000000000000000000000000";

export async function probeCaptureApi(
  apiUrl = E2E_ENV.NEXT_PUBLIC_SERVER_URL,
): Promise<{ ok: boolean; status: number; body: string }> {
  try {
    const response = await fetch(`${apiUrl.replace(/\/$/, "")}/v1/capture/reports`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${E2E_CAPTURE_KEY}`,
        Origin: E2E_ENV.NEXT_PUBLIC_APP_URL,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: `E2E probe ${Date.now()}`,
        pageUrl: E2E_ENV.NEXT_PUBLIC_APP_URL,
        metadataJson: { actions: [], console: [] },
      }),
    });
    const body = await response.text();
    return { ok: response.ok, status: response.status, body };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, status: 0, body: message };
  }
}
