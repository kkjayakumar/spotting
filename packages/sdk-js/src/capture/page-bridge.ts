import type { ConsoleLogEntry, NetworkLogEntry } from "../types";
import { pushConsoleEntry } from "./console-interceptor";
import { pushNetworkEntry } from "./network-interceptor";

const EVENT_NAME = "spotting:capture:v1";
const MESSAGE_SOURCE = "spotting-capture-v1";
const INJECTED_FLAG = "__SPOTTING_PAGE_BRIDGE_V1__";
const PAGE_CAPTURE_FLAG = "__SPOTTING_PAGE_CAPTURE_V1__";

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

export function isPageCaptureActive(): boolean {
  return Boolean((window as unknown as Record<string, unknown>)[PAGE_CAPTURE_FLAG]);
}

function waitForPageCaptureReady(timeoutMs = 5000): Promise<void> {
  if (isPageCaptureActive()) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      window.removeEventListener(EVENT_NAME, onReadyEvent);
      window.removeEventListener("message", onReadyMessage);
      if (isPageCaptureActive()) {
        resolve();
        return;
      }
      reject(new Error("Spotting page capture did not become ready in time"));
    }, timeoutMs);

    const finish = () => {
      window.clearTimeout(timer);
      window.removeEventListener(EVENT_NAME, onReadyEvent);
      window.removeEventListener("message", onReadyMessage);
      resolve();
    };

    const onReadyEvent = (event: Event) => {
      const detail = (event as CustomEvent).detail as { type?: string };
      if (detail?.type === "ready") {
        finish();
      }
    };

    const onReadyMessage = (event: MessageEvent) => {
      const data = event.data as { source?: string; type?: string } | null;
      if (data?.source === MESSAGE_SOURCE && data.type === "ready") {
        finish();
      }
    };

    window.addEventListener(EVENT_NAME, onReadyEvent);
    window.addEventListener("message", onReadyMessage);
  });
}

type CaptureBridgeMessage = {
  source?: string;
  type?: string;
  payload?: unknown;
};

function handleCaptureBridgeMessage(data: CaptureBridgeMessage | null | undefined) {
  if (!data?.type || data.source !== MESSAGE_SOURCE) {
    return;
  }

  if (data.type === "ready") {
    return;
  }

  if (data.type === "network" && data.payload) {
    pushNetworkEntry(data.payload as NetworkLogEntry);
    return;
  }

  if (data.type === "console" && data.payload) {
    pushConsoleEntry(data.payload as ConsoleLogEntry);
  }
}

function onCaptureMessage(event: MessageEvent) {
  handleCaptureBridgeMessage(event.data as CaptureBridgeMessage);
}

function onCaptureEvent(event: Event) {
  const detail = (event as CustomEvent).detail as CaptureBridgeMessage;
  handleCaptureBridgeMessage(detail);
}

export function installPageCaptureBridge(): void {
  if (bridgeInstalled || typeof window === "undefined") return;
  bridgeInstalled = true;
  window.addEventListener("message", onCaptureMessage);
  window.addEventListener(EVENT_NAME, onCaptureEvent);
}

export async function ensurePageWorldCapture(): Promise<void> {
  const runtime = getChromeRuntime();
  if (!runtime) return;
  const win = window as unknown as Record<string, unknown>;
  installPageCaptureBridge();

  if (isPageCaptureActive()) {
    win[INJECTED_FLAG] = true;
    return;
  }

  if (win[INJECTED_FLAG]) return;
  if (!injectPromise) {
    injectPromise = injectViaExtension(runtime)
      .then(async () => {
        await waitForPageCaptureReady();
        win[INJECTED_FLAG] = true;
      })
      .catch((err) => {
        injectPromise = null;
        throw err;
      });
  }
  await injectPromise;
}
