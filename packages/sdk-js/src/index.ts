export { SpottingClient, resolveCaptureApiBaseUrl } from "./client";
export * from "./capture";
export type {
  CaptureMetadata,
  ConsoleLogEntry,
  NetworkLogEntry,
  SpottingInitOptions,
  SubmitCaptureInput,
} from "./types";

import type { SpottingInitOptions } from "./types";
import { setCaptureFetchTransport } from "./capture/extension-fetch";
import { configureNetworkCapture } from "./capture/network-interceptor";
import {
  ensureCapturePipelineReady,
  installPageCaptureBridge,
} from "./capture";
import {
  destroyWidget,
  mountWidget,
  openWidgetPanel,
  triggerWidgetRecordToggle,
  triggerWidgetScreenshot,
  startWidgetRecording,
  startWidgetRecordingWithStream,
  stopWidgetRecording,
  getWidgetRecordingState,
  getPendingCaptureState,
  submitWidgetReport,
} from "./ui/widget";

export {
  openWidgetPanel,
  triggerWidgetRecordToggle,
  triggerWidgetScreenshot,
  startWidgetRecording,
  startWidgetRecordingWithStream,
  stopWidgetRecording,
  getWidgetRecordingState,
  getPendingCaptureState,
  submitWidgetReport,
  setCaptureFetchTransport,
  ensureCapturePipelineReady,
  installPageCaptureBridge,
};
export type { PendingCaptureState, WidgetRecordingState } from "./ui/widget";

/**
 * Mount the floating capture widget and start network/console interception.
 */
export function init(options: SpottingInitOptions): void {
  // Skip Spotting's own API/dashboard traffic so the capture isn't self-polluted.
  configureNetworkCapture({
    ignoreUrlPrefixes: [options.apiBaseUrl, options.dashboardUrl].filter(
      (value): value is string => Boolean(value)
    ),
  });
  mountWidget(options);
}

/** Remove widget and stop (interceptor hooks remain on the page until reload). */
export function destroy(): void {
  destroyWidget();
}
