const TARGETS = ["chrome", "firefox", "safari"];

function baseManifest() {
  return {
    manifest_version: 3,
    name: "Spotting Capture",
    version: "0.1.0",
    description:
      "Inject the Spotting bug reporter on any site (QA / third-party testing).",
    permissions: ["storage", "activeTab", "scripting", "tabs"],
    host_permissions: ["http://*/*", "https://*/*"],
    icons: {
      16: "icons/icon16.png",
      48: "icons/icon48.png",
      128: "icons/icon128.png",
    },
    action: {
      default_popup: "popup.html",
      default_title: "Spotting",
      default_icon: {
        16: "icons/icon16.png",
        48: "icons/icon48.png",
      },
    },
    background: {
      service_worker: "background.js",
      type: "module",
    },
    content_scripts: [
      {
        matches: ["http://*/*", "https://*/*"],
        js: ["page-capture.js"],
        run_at: "document_start",
        all_frames: true,
      },
      {
        matches: ["http://*/*", "https://*/*"],
        js: ["content.js"],
        run_at: "document_start",
      },
    ],
    web_accessible_resources: [
      {
        resources: ["page-capture.js"],
        matches: ["http://*/*", "https://*/*"],
      },
    ],
  };
}

export function resolveTarget(targetArg) {
  const target = String(targetArg ?? "").toLowerCase();
  if (!TARGETS.includes(target)) {
    throw new Error(
      `Unsupported target "${targetArg}". Use one of: ${TARGETS.join(", ")}.`,
    );
  }
  return target;
}

export function buildManifestForTarget(target) {
  const manifest = baseManifest();

  if (target === "chrome") {
    manifest.permissions.push("tabCapture");
    // Remove broad host permissions and static content scripts to avoid in-depth manual review delays.
    // The extension dynamically injects content scripts on active tabs via activeTab/scripting.
    delete manifest.host_permissions;
    delete manifest.content_scripts;
    delete manifest.web_accessible_resources;
    return manifest;
  }

  if (target === "firefox") {
    // AMO requires service_worker + scripts fallback; same IIFE file (vite.background.iife.config.ts).
    manifest.background = {
      service_worker: "background.js",
      scripts: ["background.js"],
    };
    // MAIN world required so fetch/console patches run in the page, not the isolated extension world.
    manifest.content_scripts[0].world = "MAIN";
    manifest.browser_specific_settings = {
      gecko: {
        id: "extension@spotting.dev",
        strict_min_version: "128.0",
        // Required for new AMO submissions (Nov 2025+). Declares what is sent when the user submits a report.
        data_collection_permissions: {
          required: ["websiteActivity", "websiteContent"],
        },
      },
    };
    return manifest;
  }

  if (target === "safari") {
    manifest.content_scripts[0].world = "MAIN";
    manifest.browser_specific_settings = {
      safari: {
        strict_min_version: "17.0",
      },
    };
    return manifest;
  }

  return manifest;
}

export const EXTENSION_TARGETS = TARGETS;
