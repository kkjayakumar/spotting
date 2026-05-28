#!/usr/bin/env node
/**
 * Spotting lineage compliance checker (Phase 0+).
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Modes:
 *   baseline (default) — fail if Phase 0 byte-identical files are unchanged
 *   mirror             — require CRIKKET_MIRROR_PATH; byte + similarity checks
 *   branding           — forbidden legacy strings in user-facing paths
 *   all                — baseline + branding (+ mirror when env set)
 *   gate               — launch gate: baseline + branding + mirror watch-path similarity
 */

import { createHash } from "node:crypto";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { loadOptionalRepoEnv } from "../load-dotenv.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
loadOptionalRepoEnv(REPO_ROOT);
const BASELINE_PATH = join(REPO_ROOT, "docs", "provenance", "phase0-baseline.json");
const MAPPINGS_PATH = join(__dirname, "path-mappings.json");

const args = new Set(process.argv.slice(2));
const mode = args.has("--gate")
  ? "gate"
  : args.has("--mirror")
    ? "mirror"
    : args.has("--branding")
      ? "branding"
      : args.has("--all")
        ? "all"
        : "baseline";

const enforceBaseline = !args.has("--report-only");
const mirrorPath = process.env.CRIKKET_MIRROR_PATH?.trim() || "";

function toPosix(p) {
  return p.split(sep).join("/");
}

function sha256(filePath) {
  const content = readFileSync(filePath);
  return createHash("sha256").update(content).digest("hex");
}

function loadJson(path) {
  const raw = readFileSync(path, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

function walkFiles(root, extensions = [".ts", ".tsx", ".css"]) {
  const files = [];
  if (!existsSync(root)) return files;

  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "dist") {
        continue;
      }
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
        files.push(full);
      }
    }
  }
  return files;
}

function mapSpottingToCrikket(spottingRel, mappings) {
  let crikketRel = spottingRel;
  for (const override of mappings.path_overrides ?? []) {
    if (spottingRel.startsWith(override.spotting)) {
      crikketRel = override.crikket + spottingRel.slice(override.spotting.length);
      break;
    }
  }
  return crikketRel;
}

function normalizeTokens(text) {
  const stripped = text.replace(/spotting|crikket|spk_|crk_|@spotting|@crikket/gi, "");
  const matches = stripped.match(/[a-zA-Z_][a-zA-Z0-9_]{2,}/g) ?? [];
  return new Set(matches.map((t) => t.toLowerCase()));
}

function jaccardPercent(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : Math.round((intersection / union) * 1000) / 10;
}

function checkBaseline() {
  const baseline = loadJson(BASELINE_PATH);
  const violations = [];

  for (const entry of baseline.identical_files ?? []) {
    if (entry.status !== "pending_rewrite") continue;

    const filePath = join(REPO_ROOT, ...entry.path.split("/"));
    if (!existsSync(filePath)) {
      violations.push({
        kind: "baseline_missing",
        path: entry.path,
        message: "Tracked identical file missing from repo",
      });
      continue;
    }

    const currentHash = sha256(filePath);
    if (currentHash === entry.phase0_sha256.toLowerCase()) {
      violations.push({
        kind: "baseline_unchanged",
        path: entry.path,
        phase: entry.phase,
        message: "File still byte-identical to Phase 0 baseline (rewrite required)",
      });
    }
  }

  return { violations, summary: baseline };
}

function checkMirror() {
  if (!mirrorPath) {
    return {
      skipped: true,
      violations: [],
      message: "CRIKKET_MIRROR_PATH not set — skipping live mirror checks",
    };
  }

  if (!existsSync(mirrorPath)) {
    return {
      skipped: false,
      violations: [
        {
          kind: "mirror_missing",
          path: mirrorPath,
          message: "CRIKKET_MIRROR_PATH does not exist on this runner",
        },
      ],
    };
  }

  const mappings = loadJson(MAPPINGS_PATH);
  const baseline = loadJson(BASELINE_PATH);
  const threshold = mappings.similarity_threshold_percent ?? 85;
  const violations = [];

  for (const tree of mappings.trees ?? []) {
    const spottingRoot = join(REPO_ROOT, ...tree.spotting.split("/"));
    const crikketRoot = join(mirrorPath, ...tree.crikket.split("/"));
    if (!existsSync(spottingRoot) || !existsSync(crikketRoot)) continue;

    for (const spottingFile of walkFiles(spottingRoot)) {
      const rel = toPosix(relative(spottingRoot, spottingFile));
      const crikketRel = mapSpottingToCrikket(`${tree.spotting}/${rel}`, mappings);
      const crikketFile = join(mirrorPath, ...crikketRel.split("/"));

      if (!existsSync(crikketFile)) continue;

      const spotHash = sha256(spottingFile);
      const crikketHash = sha256(crikketFile);
      if (spotHash === crikketHash) {
        violations.push({
          kind: "byte_identical",
          path: `${tree.spotting}/${rel}`,
          message: "Byte-identical to Crikket mirror",
        });
      }
    }
  }

  for (const entry of baseline.high_similarity_files ?? []) {
    if (entry.status !== "pending_rewrite") continue;

    const spottingFile = join(REPO_ROOT, ...entry.path.split("/"));
    const crikketRel = entry.crikket_path ?? entry.path;
    const crikketFile = join(mirrorPath, ...crikketRel.split("/"));

    if (!existsSync(spottingFile) || !existsSync(crikketFile)) continue;

    const score = jaccardPercent(
      normalizeTokens(readFileSync(spottingFile, "utf8")),
      normalizeTokens(readFileSync(crikketFile, "utf8"))
    );

    if (score > threshold) {
      violations.push({
        kind: "high_similarity",
        path: entry.path,
        score,
        threshold,
        target_phase: entry.target_phase,
        message: `Token Jaccard ${score}% exceeds ${threshold}% threshold`,
      });
    }
  }

  return { skipped: false, violations, threshold };
}

function checkMirrorWatchPaths(mirrorPath, mappings) {
  const threshold = mappings.similarity_threshold_percent ?? 85;
  const violations = [];

  for (const watchPrefix of mappings.similarity_watch_paths ?? []) {
    const spottingRoot = join(REPO_ROOT, ...watchPrefix.split("/"));
    if (!existsSync(spottingRoot)) continue;

    for (const spottingFile of walkFiles(spottingRoot)) {
      const relFromRepo = toPosix(relative(REPO_ROOT, spottingFile));
      const crikketRel = mapSpottingToCrikket(relFromRepo, mappings);
      const crikketFile = join(mirrorPath, ...crikketRel.split("/"));
      if (!existsSync(crikketFile)) continue;

      const score = jaccardPercent(
        normalizeTokens(readFileSync(spottingFile, "utf8")),
        normalizeTokens(readFileSync(crikketFile, "utf8")),
      );

      if (score > threshold) {
        violations.push({
          kind: "watch_high_similarity",
          path: relFromRepo,
          score,
          threshold,
          message: `Watch-path token Jaccard ${score}% exceeds ${threshold}% threshold`,
        });
      }
    }
  }

  return { violations, threshold };
}

function checkBranding() {
  const targets = [
    "README.md",
    "packages/shared/src/config/site.ts",
    "docs/capture-embed.md",
    "apps/extension/README.md",
    "apps/web/src",
  ];

  const rg = spawnSync(
    "rg",
    [
      "-i",
      "crikket|open-source|open source",
      ...targets,
      "--glob",
      "!**/*.lock",
      "--glob",
      "!**/node_modules/**",
    ],
    { cwd: REPO_ROOT, encoding: "utf8" }
  );

  if (rg.status === 0 && rg.stdout.trim()) {
    return {
      violations: [
        {
          kind: "branding",
          message: "Forbidden legacy/open-source strings found",
          details: rg.stdout.trim(),
        },
      ],
    };
  }

  if (rg.status !== 0 && rg.status !== 1) {
    return {
      violations: [
        {
          kind: "branding_tool",
          message: "ripgrep (rg) unavailable — install rg or run branding check in CI only",
        },
      ],
      skipped: true,
    };
  }

  return { violations: [] };
}

function printViolations(title, violations) {
  if (violations.length === 0) {
    console.log(`✓ ${title}: passed`);
    return;
  }

  console.error(`✗ ${title}: ${violations.length} violation(s)`);
  for (const v of violations) {
    const loc = v.path ? ` [${v.path}]` : "";
    const extra = v.score != null ? ` (${v.score}%)` : "";
    console.error(`  - ${v.kind}${loc}${extra}: ${v.message}`);
    if (v.details) {
      console.error(v.details.split("\n").map((l) => `    ${l}`).join("\n"));
    }
  }
}

function main() {
  console.log("Spotting lineage compliance check");
  console.log(`Mode: ${mode}`);
  if (mirrorPath) console.log(`Mirror: ${mirrorPath}`);

  const allViolations = [];

  if (mode === "baseline" || mode === "all" || mode === "gate") {
    const { violations, summary } = checkBaseline();
    printViolations("Phase 0 baseline (byte-identical files)", violations);
    allViolations.push(...violations);

    const pending = (summary.identical_files ?? []).filter((e) => e.status === "pending_rewrite").length;
    const simPending = (summary.high_similarity_files ?? []).filter((e) => e.status === "pending_rewrite").length;
    console.log(`  Pending Phase 1 rewrites: ${pending}`);
    console.log(`  Pending Phase 2/3 similarity rewrites: ${simPending}`);

    if (mode === "gate" && (pending > 0 || simPending > 0)) {
      allViolations.push({
        kind: "gate_pending_rewrites",
        message: "Phase 7 gate requires 0 pending baseline rewrites",
      });
    }
  }

  if (mode === "mirror" || mode === "gate") {
    const mirror = checkMirror();
    if (mirror.skipped) {
      console.log(`○ Mirror checks: ${mirror.message}`);
      if (mode === "gate") {
        console.log(
          "  Gate note: set CRIKKET_MIRROR_PATH for live similarity scan on watch paths.",
        );
      }
    } else {
      printViolations("Crikket mirror checks", mirror.violations);
      allViolations.push(...mirror.violations);

      const mappings = loadJson(MAPPINGS_PATH);
      const watch = checkMirrorWatchPaths(mirrorPath, mappings);
      printViolations("Mirror watch-path similarity (>85%)", watch.violations);
      allViolations.push(...watch.violations);

      const target = mappings.target_threshold_percent ?? 70;
      const aboveTarget = watch.violations.filter((v) => v.score > target).length;
      console.log(
        `  Watch-path files above ${target}% target threshold: ${aboveTarget}`,
      );
    }
  }

  if (mode === "branding" || mode === "all" || mode === "gate") {
    const branding = checkBranding();
    if (branding.skipped) {
      console.log("○ Branding check skipped (rg unavailable)");
    } else {
      printViolations("Branding guard", branding.violations);
      allViolations.push(...branding.violations);
    }
  }

  const shouldFail = enforceBaseline && allViolations.length > 0;
  if (shouldFail) {
    console.error("\nLineage check failed. See docs/provenance/README.md for remediation.");
    process.exit(1);
  }

  if (allViolations.length > 0) {
    console.log("\nViolations reported (--report-only). CI would fail with --enforce-baseline.");
  } else {
    console.log("\nAll lineage checks passed.");
  }
}

main();
