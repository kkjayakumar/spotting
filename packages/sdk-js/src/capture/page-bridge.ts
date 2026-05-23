import type { ConsoleLogEntry, NetworkLogEntry } from "../types";
import { pushConsoleEntry } from "./console-interceptor";
import { pushNetworkEntry } from "./network-interceptor";

const EVENT_NAME = "spotting:capture:v1";
const INJECTED_FLAG = "__SPOTTING_PAGE_BRIDGE_V1__";

let bridgeInstalled = false;
let injectPromise: Promise<void> | null = null;

type ChromeRuntime = {
  id?: string;
  getURL: (path: string) => string;
};

function getChromeRuntime(): ChromeRuntime | null {
  try {
    const g = globalThis as { chrome?: { runtime?: ChromeRuntime } };
    const runtime = g.chrome?.runtime;
    if (runtime?.id && typeof runtime.getURL === "function") {
      return runtime;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function hasChromeExtensionRuntime(): boolean {
  return getChromeRuntime() !== null;
}

function injectViaExtension(runtime: ChromeRuntime): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = runtime.getURL("page-capture.js");
    script.async = false;
    script.onload = () => {
      script.remove();
      resolve();
    };
    script.onerror = () => {
      script.remove();
      reject(new Error("Failed to load Spotting page capture script"));
    };
    (document.head || document.documentElement).appendChild(script);
  });
}

function onCaptureEvent(event: Event) {
  const detail = (event as CustomEvent).detail as {
    type?: string;
    payload?: unknown;
  };
  if (!detail?.type) return;

  if (detail.type === "network" && detail.payload) {
    pushNetworkEntry(detail.payload as NetworkLogEntry);
    return;
  }

  if (detail.type === "console" && detail.payload) {
    pushConsoleEntry(detail.payload as ConsoleLogEntry);
  }
}

export function installPageCaptureBridge(): void {
  if (bridgeInstalled || typeof window === "undefined") return;
  bridgeInstalled = true;
  window.addEventListener(EVENT_NAME, onCaptureEvent);
}

export async function ensurePageWorldCapture(): Promise<void> {
  const runtime = getChromeRuntime();
  if (!runtime) return;
  const win = window as unknown as Record<string, unknown>;
  if (win[INJECTED_FLAG]) return;
  if (!injectPromise) {
    installPageCaptureBridge();
    injectPromise = injectViaExtension(runtime)
      .then(() => {
        win[INJECTED_FLAG] = true;
      })
      .catch((err) => {
        injectPromise = null;
        throw err;
      });
  }
  await injectPromise;
}
