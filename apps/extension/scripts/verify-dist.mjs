import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const target = process.argv[2] ?? "chrome";

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
  console.error("\nRun from repo root: npm run build:extension");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(join(dist, "manifest.json"), "utf8"));
if (manifest?.manifest_version !== 3) {
  console.error("manifest.json must use manifest_version 3.");
  process.exit(1);
}

if (target === "chrome") {
  if (!manifest.permissions?.includes("tabCapture")) {
    console.error("Chrome target requires tabCapture permission.");
    process.exit(1);
  }
  if (manifest.content_scripts?.[0]?.world !== "MAIN") {
    console.error('Chrome target must set content_scripts[0].world to "MAIN".');
    process.exit(1);
  }
}

if (target === "firefox") {
  if (manifest.permissions?.includes("tabCapture")) {
    console.error("Firefox target cannot include tabCapture permission.");
    process.exit(1);
  }
  if (manifest.content_scripts?.[0]?.world !== "MAIN") {
    console.error('Firefox target must set content_scripts[0].world to "MAIN".');
    process.exit(1);
  }
  if (!manifest.browser_specific_settings?.gecko?.id) {
    console.error("Firefox target must set browser_specific_settings.gecko.id.");
    process.exit(1);
  }
}

if (target === "safari") {
  if (manifest.permissions?.includes("tabCapture")) {
    console.error("Safari target cannot include tabCapture permission.");
    process.exit(1);
  }
  if (manifest.content_scripts?.[0]?.world !== "MAIN") {
    console.error('Safari target must set content_scripts[0].world to "MAIN".');
    process.exit(1);
  }
}

console.log(
  `Extension dist OK (${required.length} required files, target: ${target})`,
);
