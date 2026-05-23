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
import {
  destroyWidget,
  mountWidget,
  openWidgetPanel,
  triggerWidgetRecordToggle,
  triggerWidgetScreenshot,
  startWidgetRecording,
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
  stopWidgetRecording,
  getWidgetRecordingState,
  getPendingCaptureState,
  submitWidgetReport,
  setCaptureFetchTransport,
};
export type { PendingCaptureState, WidgetRecordingState } from "./ui/widget";

/**
 * Mount the floating capture widget and start network/console interception.
 */
export function init(options: SpottingInitOptions): void {
  mountWidget(options);
}

/** Remove widget and stop (interceptor hooks remain on the page until reload). */
export function destroy(): void {
  destroyWidget();
}
