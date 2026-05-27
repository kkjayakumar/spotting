#!/usr/bin/env node
/**
 * Start the full Spotting stack (Postgres + Redis + API + worker + web).
 * Stops dev infra compose first to avoid container-name / port conflicts.
 */
import { execSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const envFile = join(root, ".env");
const envFlag = existsSync(envFile) ? `--env-file "${envFile}"` : "";

function loadPort(key, fallback) {
  if (!existsSync(envFile)) return fallback;
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith(`${key}=`)) {
      return trimmed.slice(key.length + 1).trim() || fallback;
    }
  }
  return fallback;
}

function run(command) {
  execSync(command, { cwd: root, stdio: "inherit", shell: true });
}

try {
  console.log("Stopping dev infra compose (if running) to avoid conflicts…");
  run(`docker compose -f infra/docker/docker-compose.yml ${envFlag} down`);
} catch {
  /* infra may not be running */
}

for (const legacy of [
  "spotting-postgres",
  "spotting-redis",
  "spotting-api",
  "spotting-web",
  "spotting-worker",
]) {
  spawnSync("docker", ["rm", "-f", legacy], { stdio: "ignore" });
}

console.log("\nBuilding and starting Spotting stack…");
run(`docker compose ${envFlag} up --build -d`);

const webPort = loadPort("WEB_PORT", "3001");
const apiPort = loadPort("API_PORT", "3000");
const siteUrl = loadPort("NEXT_PUBLIC_APP_URL", `http://127.0.0.1:${webPort}`);

console.log("\nSpotting is starting. Wait ~30–60s for API healthcheck, then open:\n");
console.log(`  Web:  ${siteUrl}`);
console.log(`  API:  http://127.0.0.1:${apiPort}/healthz`);
console.log("\nLogs: npm run docker:logs");
console.log("Stop: npm run docker:down\n");
