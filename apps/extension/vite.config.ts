import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

const root = __dirname;

/** Content script must be a separate IIFE build (no top-level import). */
function runViteBuild(configFile: string) {
  execSync(`vite build --config ${configFile}`, {
    cwd: root,
    stdio: "inherit",
  });
}

function buildContentScript(): Plugin {
  return {
    name: "spotting-build-content-script",
    closeBundle() {
      runViteBuild("vite.content.config.ts");
      runViteBuild("vite.page.config.ts");
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [buildContentScript()],
  build: {
    outDir: "dist",
    emptyDir: true,
    rollupOptions: {
      input: {
        background: resolve(root, "src/background.ts"),
        popup: resolve(root, "popup.html"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name].js",
        assetFileNames: "[name][extname]",
      },
    },
    target: "es2022",
    sourcemap: true,
  },
  publicDir: "public",
});
