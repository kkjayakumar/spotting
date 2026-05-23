import { installConsoleInterceptor } from "./console-interceptor";
import { ensurePageWorldCapture, hasChromeExtensionRuntime } from "./page-bridge";
import { installNetworkInterceptor } from "./network-interceptor";

let installed = false;

/** Install network + console capture (page world when running as extension). */
export async function installCapturePipeline(): Promise<void> {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const inExtension = hasChromeExtensionRuntime();

  if (inExtension) {
    try {
      await ensurePageWorldCapture();
      return;
    } catch {
      /* fall back to isolated-world patches */
    }
  }

  installNetworkInterceptor();
  installConsoleInterceptor();
}
