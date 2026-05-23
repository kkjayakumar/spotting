import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");

const required = [
  "manifest.json",
  "content.js",
  "page-capture.js",
  "background.js",
  "popup.html",
  "popup.js",
  "icons/icon16.png",
  "icons/icon48.png",
  "icons/icon128.png",
];

const missing = required.filter((file) => !existsSync(join(dist, file)));

if (missing.length > 0) {
  console.error("Extension dist is incomplete. Missing:");
  for (const file of missing) {
    console.error(`  - ${file}`);
  }
  console.error("\nRun from repo root: bun run build:extension");
  process.exit(1);
}

console.log("Extension dist OK (" + required.length + " required files)");
