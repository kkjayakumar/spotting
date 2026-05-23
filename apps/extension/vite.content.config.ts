import { resolve } from "node:path";
import { defineConfig } from "vite";

/** Single IIFE bundle — no top-level `import` (required for Chrome content scripts). */
export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, "src/content.ts"),
      name: "SpottingContent",
      formats: ["iife"],
      fileName: () => "content.js",
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
