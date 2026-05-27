import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test, expect, type APIResponse } from "@playwright/test";

import { E2E_FIXTURES } from "./fixtures";

async function expectCaptureReportCreated(captureResponse: APIResponse) {
  if (!captureResponse.ok()) {
    const body = await captureResponse.text();
    throw new Error(
      `Capture API failed (${captureResponse.status()}): ${body.slice(0, 500)}. ` +
        "If Docker API is on :3000, stop it (`docker compose stop api`) so Playwright starts a dev API " +
        `using DATABASE_URL ${E2E_FIXTURES.apiUrl.includes("3000") ? "(infra Postgres on :5433)" : ""}.`,
    );
  }
}

const dbReady =
  readFileSync(resolve(__dirname, ".db-ready"), "utf8").trim() === "1";

test.describe("Phase 7 critical journey", () => {
  test.skip(!dbReady, "PostgreSQL required (see docs/provenance/PHASE7-VERIFICATION.md)");

  test("capture → viewer → dashboard", async ({ page, request }) => {
    const reportTitle = `E2E Capture ${Date.now()}`;

    const captureResponse = await request.post(
      `${E2E_FIXTURES.apiUrl}/v1/capture/reports`,
      {
        headers: {
          Authorization: `Bearer ${E2E_FIXTURES.captureKey}`,
          Origin: E2E_FIXTURES.appUrl,
          "Content-Type": "application/json",
        },
        data: {
          title: reportTitle,
          description: "Phase 7 verification gate E2E",
          pageUrl: E2E_FIXTURES.appUrl,
          metadataJson: {
            actions: [],
            consoleLogs: [],
            submissionStatus: "ready",
          },
        },
      },
    );

    await expectCaptureReportCreated(captureResponse);
    const report = (await captureResponse.json()) as { id: string };
    expect(report.id).toBeTruthy();

    await page.goto("/login?callbackURL=/dashboard");
    await page.locator('input[type="email"]').fill(E2E_FIXTURES.email);
    await page.locator('input[type="password"]').fill(E2E_FIXTURES.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });

    await page.goto(`/s/${report.id}`);
    await expect(page.getByRole("heading", { name: reportTitle })).toBeVisible({
      timeout: 30_000,
    });

    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Reports", exact: true })).toBeVisible();
    await expect(
      page.getByRole("link", { name: `Open ${reportTitle}` }),
    ).toBeVisible({ timeout: 30_000 });
  });
});
