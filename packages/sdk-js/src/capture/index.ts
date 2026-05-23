export {
  clearConsoleLog,
  getConsoleLog,
  installConsoleInterceptor,
  setConsoleBufferLimits,
} from "./console-interceptor";
export {
  clearNetworkLog,
  getNetworkLog,
  installNetworkInterceptor,
  setNetworkBufferLimits,
} from "./network-interceptor";
export { captureScreenshotPng } from "./screenshot";
export {
  startScreenRecording,
  stopScreenRecording,
  type RecorderState,
} from "./screen-recorder";
export {
  getUserActionLog,
  installUserActionCapture,
  setUserActionBufferLimits,
  type UserActionEntry,
} from "./user-actions";
export {
  getCaptureSessionDurationMs,
  getCaptureSessionEndedAt,
  getCaptureSessionStartedAt,
  markCaptureSessionEnd,
  markCaptureSessionStart,
  resetCaptureSession,
} from "./capture-session";
export { installCapturePipeline } from "./install-capture";
export {
  getCaptureFetchTransport,
  setCaptureFetchTransport,
  type CaptureFetchTransport,
} from "./extension-fetch";
