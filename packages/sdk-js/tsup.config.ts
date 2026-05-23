import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/index.ts", standalone: "src/standalone.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    treeshake: true,
    target: "es2022",
  },
  {
    entry: { "spotting-capture": "src/standalone.ts" },
    format: ["iife"],
    globalName: "SpottingCapture",
    minify: true,
    sourcemap: true,
    outDir: "dist",
    treeshake: true,
    target: "es2022",
  },
  {
    entry: { "page-capture": "src/capture/page-world-entry.ts" },
    format: ["iife"],
    minify: true,
    sourcemap: true,
    outDir: "dist",
    treeshake: true,
    target: "es2022",
  },
]);
