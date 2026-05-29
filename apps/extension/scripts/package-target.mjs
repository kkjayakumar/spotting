import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import { resolveTarget } from "./manifest-targets.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const targetArg = process.argv[2] ?? "chrome";
const target = resolveTarget(targetArg);
const targetDir = join(rootDir, "dist-targets", target);
const packageDir = join(rootDir, "dist-packages");
const packageExt = target === "firefox" ? "xpi" : "zip";
const packagePath = join(packageDir, `spotting-extension-${target}.${packageExt}`);

if (!existsSync(targetDir)) {
  throw new Error(`Missing ${targetDir}. Run build:${target} first.`);
}

mkdirSync(packageDir, { recursive: true });
rmSync(packagePath, { force: true });

execSync(
  `tar -a -c -f "${packagePath}" -C "${targetDir}" .`,
  { cwd: rootDir, stdio: "inherit" },
);

console.log(`Packaged ${target}: ${packagePath}`);
