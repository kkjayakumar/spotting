import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
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

function applyEnvFile(path: string, override: boolean, systemEnvKeys: Set<string>): boolean {
  if (!existsSync(path)) return false;
  const content = readFileSync(path, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (!parsed) continue;
    if (systemEnvKeys.has(parsed.key)) continue;
    if (override || process.env[parsed.key] === undefined) {
      process.env[parsed.key] = parsed.value;
    }
  }
  return true;
}

/** Load repo root `.env` then `apps/api/.env` (API overrides). */
export function loadApiEnv() {
  const systemEnvKeys = new Set(Object.keys(process.env));
  const apiDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const repoRoot = resolve(apiDir, "../..");
  const envFiles = [
    resolve(repoRoot, ".env"),
    resolve(apiDir, ".env"),
  ] as const;

  for (const [index, file] of envFiles.entries()) {
    const loaded = applyEnvFile(file, index === envFiles.length - 1, systemEnvKeys);
    if (loaded) {
      logger.info("env_file_loaded", { path: file });
    }
  }
}
