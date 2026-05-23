import { resolve } from "node:path";
import { defineConfig } from "vite";

/** MAIN-world script: patches page fetch/XHR/console (loaded via <script src>). */
export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    lib: {
      entry: resolve(
        __dirname,
        "../../packages/sdk-js/src/capture/page-world-entry.ts",
      ),
      name: "SpottingPageCapture",
      formats: ["iife"],
      fileName: () => "page-capture.js",
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        extend: true,
      },
    },
    target: "es2022",
    sourcemap: true,
  },
});
