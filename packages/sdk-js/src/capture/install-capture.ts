import { installConsoleInterceptor } from "./console-interceptor";
import {
  ensurePageWorldCapture,
  hasChromeExtensionRuntime,
  isPageCaptureActive,
} from "./page-bridge";
import { installNetworkInterceptor } from "./network-interceptor";

let pipelinePromise: Promise<void> | null = null;

async function installCapturePipelineImpl(): Promise<void> {
  if (typeof window === "undefined") return;

  const inExtension = hasChromeExtensionRuntime();

  if (inExtension) {
    try {
      await ensurePageWorldCapture();
    } catch {
      /* fall back to isolated-world patches only */
    }
  }

  // Isolated-world patches only help when MAIN-world injection failed.
  if (!isPageCaptureActive()) {
    installNetworkInterceptor();
    installConsoleInterceptor();
  }
}

/** Install network + console capture (page world when running as extension). */
export async function installCapturePipeline(): Promise<void> {
  return ensureCapturePipelineReady();
}

/** Idempotent; resolves when capture hooks are ready for the current page. */
export function ensureCapturePipelineReady(): Promise<void> {
  if (!pipelinePromise) {
    pipelinePromise = installCapturePipelineImpl().catch((err) => {
      pipelinePromise = null;
      throw err;
    });
  }
  return pipelinePromise;
}
