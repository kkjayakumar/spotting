/**
 * Load optional repo .env files into process.env (CI-safe; never required).
 * Copyright (C) 2026 Sheshi AI / Spotting. All rights reserved.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function parseEnvLine(line) {
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

function applyEnvFile(path, override, systemEnvKeys) {
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

/** Load root `.env` then optional app overrides (later files win). */
export function loadOptionalRepoEnv(repoRoot) {
  const systemEnvKeys = new Set(Object.keys(process.env));
  const files = [
    join(repoRoot, ".env"),
    join(repoRoot, "apps/api/.env"),
    join(repoRoot, "apps/web/.env"),
  ];
  for (const [index, file] of files.entries()) {
    applyEnvFile(file, index === files.length - 1, systemEnvKeys);
  }
}
