import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createLogger } from "@spotting/config/logger";

const logger = createLogger("env");

function parseEnvLine(line: string): { key: string; value: string } | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const eq = trimmed.indexOf("=");
  if (eq <= 0) return null;
  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return { key, value };
}

function applyEnvFile(path: string, override: boolean): boolean {
  if (!existsSync(path)) return false;
  const content = readFileSync(path, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (!parsed) continue;
    if (override || process.env[parsed.key] === undefined) {
      process.env[parsed.key] = parsed.value;
    }
  }
  return true;
}

/** Load repo root `.env` then `apps/api/.env` (API overrides). */
export function loadApiEnv() {
  const apiDir = resolve(import.meta.dir, "..");
  const repoRoot = resolve(apiDir, "../..");
  const envFiles = [
    resolve(repoRoot, ".env"),
    resolve(apiDir, ".env"),
  ] as const;

  for (const [index, file] of envFiles.entries()) {
    const loaded = applyEnvFile(file, index === envFiles.length - 1);
    if (loaded) {
      logger.info("env_file_loaded", { path: file });
    }
  }
}
