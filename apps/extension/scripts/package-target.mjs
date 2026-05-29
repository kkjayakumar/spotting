import { createWriteStream, existsSync, mkdirSync, rmSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import JSZip from "jszip";

import { resolveTarget } from "./manifest-targets.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const targetArg = process.argv[2] ?? "chrome";
const target = resolveTarget(targetArg);
const targetDir = join(rootDir, "dist-targets", target);
const packageDir = join(rootDir, "dist-packages");
const packageExt = target === "firefox" ? "xpi" : "zip";
const packagePath = join(packageDir, `spotting-extension-${target}.${packageExt}`);

/** Omit source maps from store/submission packages (smaller, avoids validator edge cases). */
const OMIT_FROM_PACKAGE = /\.map$/i;

async function addDirectoryToZip(zip, absoluteDir, zipPrefix = "") {
  const entries = await readdir(absoluteDir, { withFileTypes: true });
  for (const entry of entries) {
    if (OMIT_FROM_PACKAGE.test(entry.name)) {
      continue;
    }
    const abs = join(absoluteDir, entry.name);
    const zipEntry = zipPrefix
      ? posix.join(zipPrefix, entry.name)
      : entry.name;
    if (entry.isDirectory()) {
      await addDirectoryToZip(zip, abs, zipEntry);
    } else {
      zip.file(zipEntry, await readFile(abs));
    }
  }
}

async function writeZipArchive(zip, outputPath) {
  const nodeStream = zip.generateNodeStream({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
    streamFiles: true,
  });
  await pipeline(nodeStream, createWriteStream(outputPath));
}

async function verifyPackageRoot(outputPath) {
  const zip = await JSZip.loadAsync(await readFile(outputPath));
  if (!zip.files["manifest.json"]) {
    throw new Error(
      `Package is missing manifest.json at archive root: ${outputPath}`,
    );
  }
  const badPrefix = Object.keys(zip.files).some(
    (name) => name.startsWith("./") || name.startsWith("/"),
  );
  if (badPrefix) {
    throw new Error(
      `Package has invalid entry paths (./ prefix). Rebuild with npm run package:${target}.`,
    );
  }
}

if (!existsSync(targetDir)) {
  throw new Error(`Missing ${targetDir}. Run build:${target} first.`);
}

mkdirSync(packageDir, { recursive: true });
rmSync(packagePath, { force: true });

const zip = new JSZip();
await addDirectoryToZip(zip, targetDir, "");
await writeZipArchive(zip, packagePath);
await verifyPackageRoot(packagePath);

console.log(`Packaged ${target}: ${packagePath}`);
