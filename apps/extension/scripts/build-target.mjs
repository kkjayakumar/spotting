import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import { buildManifestForTarget, resolveTarget } from "./manifest-targets.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const targetArg = process.argv[2] ?? "chrome";
const target = resolveTarget(targetArg);
const distDir = join(rootDir, "dist");
const artifactsDir = join(rootDir, "dist-targets");
const targetDir = join(artifactsDir, target);

function run(command) {
  execSync(command, { cwd: rootDir, stdio: "inherit" });
}

rmSync(targetDir, { recursive: true, force: true });
mkdirSync(artifactsDir, { recursive: true });

// Content script resolves @spotting/sdk-js to packages/sdk-js/dist — rebuild first.
run("npm run build -w @spotting/sdk-js");

run("vite build");

if (target === "firefox") {
  // Firefox background.scripts expects classic script (no ESM imports).
  run("vite build --config vite.background.iife.config.ts");
}

const manifest = buildManifestForTarget(target);
writeFileSync(join(distDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

run(`node scripts/verify-dist.mjs ${target}`);

cpSync(distDir, targetDir, { recursive: true });
console.log(`Built extension target "${target}" -> ${targetDir}`);
