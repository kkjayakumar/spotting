import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { E2E_ENV } from "./env";

const DB_READY_FILE = resolve(__dirname, ".db-ready");
const repoRoot = resolve(__dirname, "../../..");

function markDbReady(ready: boolean) {
  writeFileSync(DB_READY_FILE, ready ? "1" : "0", "utf8");
}

function e2eProcessEnv() {
  return {
    ...process.env,
    ...E2E_ENV,
  };
}

export default async function globalSetup() {
  if (process.env.SKIP_E2E_DB === "true") {
    console.log("SKIP_E2E_DB=true — skipping database push and E2E seed");
    markDbReady(false);
    return;
  }

  try {
    try {
      execSync("npm run db:push:schema-only -w @spotting/api", {
        cwd: repoRoot,
        stdio: "inherit",
        env: e2eProcessEnv(),
      });
    } catch {
      // Windows: query_engine DLL may be locked while the API dev server is running.
      execSync("npm run db:push -w @spotting/api", {
        cwd: repoRoot,
        stdio: "inherit",
        env: e2eProcessEnv(),
      });
    }

    execSync("npm run e2e:seed -w @spotting/api", {
      cwd: repoRoot,
      stdio: "inherit",
      env: e2eProcessEnv(),
    });

    markDbReady(true);
  } catch (error) {
    markDbReady(false);
    console.warn(
      "E2E database setup failed — capture-journey.spec.ts will skip. Start Postgres or set SKIP_E2E_DB=true for smoke-only runs.",
    );
    if (error instanceof Error) {
      console.warn(error.message);
    }
  }
}
