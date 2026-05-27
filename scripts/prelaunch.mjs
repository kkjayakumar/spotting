#!/usr/bin/env node
/**
 * Spotting pre-launch gate — runs engineering checklist end-to-end.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Usage:
 *   npm run prelaunch              # full gate (infra + migrate + verify + gate + e2e)
 *   npm run prelaunch -- --skip-infra
 *   npm run prelaunch -- --skip-e2e
 */
import { execSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const ENV_PATH = join(REPO_ROOT, ".env");
const MIRROR_STATUS_PATH = join(
  REPO_ROOT,
  "docs",
  "provenance",
  "mirror-scan-status.md",
);

const args = new Set(process.argv.slice(2));
const skipInfra = args.has("--skip-infra");
const skipE2e = args.has("--skip-e2e");
const skipMigrate = args.has("--skip-migrate");
const needsDatabase = !skipMigrate || !skipE2e;

function log(title) {
  console.log(`\n=== ${title} ===\n`);
}

function run(command, options = {}) {
  console.log(`> ${command}`);
  execSync(command, {
    cwd: REPO_ROOT,
    stdio: "inherit",
    env: { ...process.env, ...options.env },
    ...options,
  });
}

function tryRun(command, options = {}) {
  try {
    run(command, options);
    return true;
  } catch {
    return false;
  }
}

function loadDotEnv(path) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function dockerAvailable() {
  const result = spawnSync("docker", ["info"], {
    cwd: REPO_ROOT,
    stdio: "ignore",
  });
  return result.status === 0;
}

function waitForPostgres(maxAttempts = 30) {
  const databaseUrl =
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5433/spotting?schema=public";

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const probe = spawnSync(
      "npm",
      ["run", "db:push", "-w", "@spotting/api"],
      {
        cwd: REPO_ROOT,
        stdio: "ignore",
        env: { ...process.env, DATABASE_URL: databaseUrl },
        shell: process.platform === "win32",
      },
    );
    if (probe.status === 0) {
      console.log("PostgreSQL is ready.");
      return true;
    }
    console.log(`Waiting for PostgreSQL (${attempt}/${maxAttempts})…`);
    execSync("node -e \"setTimeout(()=>{}, 2000)\"");
  }
  return false;
}

function setEnvFlag(key, value) {
  if (!existsSync(ENV_PATH)) {
    writeFileSync(ENV_PATH, `${key}=${value}\n`, "utf8");
    return;
  }

  const lines = readFileSync(ENV_PATH, "utf8").split(/\r?\n/);
  let found = false;
  const next = lines.map((line) => {
    if (line.startsWith(`${key}=`)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });
  if (!found) {
    next.push(`${key}=${value}`);
  }
  writeFileSync(ENV_PATH, `${next.join("\n").replace(/\n*$/, "")}\n`, "utf8");
}

function migrateBetterAuthEnv() {
  if (!existsSync(ENV_PATH)) return;
  let content = readFileSync(ENV_PATH, "utf8");
  if (!content.includes("BETTER_AUTH_")) return;

  content = content
    .replace(/^BETTER_AUTH_SECRET=/gm, "SPOTTING_AUTH_SECRET=")
    .replace(/^BETTER_AUTH_URL=/gm, "SPOTTING_AUTH_URL=")
    .replace(/^# BETTER_AUTH_/gm, "# SPOTTING_AUTH_");
  writeFileSync(ENV_PATH, content, "utf8");
  console.log("Renamed BETTER_AUTH_* → SPOTTING_AUTH_* in .env");
}

function redactMirrorPath(mirrorPath) {
  if (!mirrorPath) return "(not set)";
  const parts = mirrorPath.replace(/\\/g, "/").split("/");
  return parts.length > 2 ? `…/${parts.slice(-2).join("/")}` : mirrorPath;
}

function writeMirrorStatus({ ran, mirrorPath, exitCode, note }) {
  const date = new Date().toISOString().slice(0, 10);
  const body = `# Mirror scan status

**Last run:** ${date}  
**Mirror path:** ${redactMirrorPath(mirrorPath)}  
**Scan executed:** ${ran ? "yes" : "no"}  
**Result:** ${exitCode === 0 ? "pass" : ran ? "fail" : "skipped"}

${note}

Re-run:

\`\`\`bash
# Set CRIKKET_MIRROR_PATH in .env (local only — never commit), then:
npm run check:gate
\`\`\`
`;
  writeFileSync(MIRROR_STATUS_PATH, body, "utf8");
}

function main() {
  loadDotEnv(ENV_PATH);
  migrateBetterAuthEnv();

  if (!skipInfra && needsDatabase) {
    log("1/6 — Local infra (Postgres)");
    if (!dockerAvailable()) {
      console.error(
        "Docker is not running. Start Docker Desktop, then re-run `npm run prelaunch`.\n" +
          "Or use: npm run prelaunch -- --skip-infra --skip-migrate --skip-e2e (verify + gate only).",
      );
      process.exit(1);
    }
    run("npm run infra:up");
    if (!waitForPostgres()) {
      console.error("PostgreSQL did not become ready on DATABASE_URL.");
      process.exit(1);
    }
  } else if (needsDatabase) {
    log("1/6 — Local infra (skipped — using existing Postgres)");
    if (!tryRun("npm run db:push -w @spotting/api")) {
      console.error(
        "Database unreachable. Start Docker (`npm run infra:up`) or fix DATABASE_URL in .env.",
      );
      process.exit(1);
    }
  } else {
    log("1/6 — Local infra (skipped — no database steps)");
  }

  if (!skipMigrate) {
    log("2/6 — Capture key migration (crk_ → spk_)");
    run("npm run migrate:capture-keys -w @spotting/api -- --dry-run");
    run("npm run migrate:capture-keys -w @spotting/api");
    setEnvFlag("SPOTTING_ACCEPT_LEGACY_CRK_KEYS", "false");
    console.log("Set SPOTTING_ACCEPT_LEGACY_CRK_KEYS=false in .env");
  } else {
    log("2/6 — Capture key migration (skipped)");
  }

  log("3/6 — verify");
  run("npm run verify");

  log("4/6 — check:gate");
  const mirrorPath = process.env.CRIKKET_MIRROR_PATH?.trim() ?? "";
  if (mirrorPath && !existsSync(mirrorPath)) {
    console.warn(`CRIKKET_MIRROR_PATH is set but path does not exist: ${mirrorPath}`);
    writeMirrorStatus({
      ran: false,
      mirrorPath,
      exitCode: 1,
      note: "Mirror path configured but not found on disk.",
    });
  } else if (mirrorPath) {
    try {
      run("npm run check:gate", { env: { CRIKKET_MIRROR_PATH: mirrorPath } });
      writeMirrorStatus({
        ran: true,
        mirrorPath,
        exitCode: 0,
        note: "Mirror watch-path scan passed.",
      });
    } catch {
      writeMirrorStatus({
        ran: true,
        mirrorPath,
        exitCode: 1,
        note: "Mirror scan failed — review check:gate output.",
      });
      process.exit(1);
    }
  } else {
    run("npm run check:gate");
    writeMirrorStatus({
      ran: false,
      mirrorPath: "",
      exitCode: 0,
      note:
        "No CRIKKET_MIRROR_PATH configured. Baseline gate passed; add a private mirror path to .env for full similarity scan.",
    });
  }

  if (!skipE2e) {
    log("5/6 — Playwright E2E (capture → viewer → dashboard)");
    log("5a — Release :3000 for E2E dev API (Docker API uses a separate Postgres)");
    tryRun("docker compose --env-file .env stop api");
    run("npm run test:e2e", {
      env: {
        ...process.env,
        PLAYWRIGHT_REUSE_SERVER: "false",
        DATABASE_URL:
          process.env.DATABASE_URL ??
          "postgresql://postgres:postgres@localhost:5433/spotting?schema=public",
        NEXT_PUBLIC_SITE_URL: "http://localhost:3003",
        NEXT_PUBLIC_APP_URL: "http://localhost:3003",
        NEXT_PUBLIC_SERVER_URL: "http://localhost:3000",
        SPOTTING_ACCEPT_LEGACY_CRK_KEYS: "true",
      },
    });
  } else {
    log("5/6 — Playwright E2E (skipped)");
  }

  log("6/6 — Counsel package");
  console.log(
    "Engineering gate complete. Share with counsel:\n" +
      "  - docs/provenance/ENGINEERING-ATTESTATION.md\n" +
      "  - docs/provenance/COUNSEL-REVIEW.md\n" +
      "  - docs/provenance/mirror-scan-status.md\n" +
      "  - Latest CI / prelaunch logs",
  );
}

main();
