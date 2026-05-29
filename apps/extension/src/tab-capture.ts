/// <reference types="chrome" />

type TabCaptureConstraints = MediaTrackConstraints & {
  mandatory?: {
    chromeMediaSource: "tab";
    chromeMediaSourceId: string;
  };
};

import {
  hasRuntimeApi,
  hasTabCaptureApi,
  runtimeSendMessage,
} from "./browser-api";

export async function captureCurrentTabStream(): Promise<MediaStream> {
  const response = await runtimeSendMessage<
    { type: "SPOTTING_TAB_CAPTURE_STREAM_ID" },
    { ok?: boolean; streamId?: string; error?: string }
  >({ type: "SPOTTING_TAB_CAPTURE_STREAM_ID" });
  if (!response?.ok || !response.streamId) {
    throw new Error(
      response?.error ?? "Could not start tab capture for this page.",
    );
  }
  const streamId = response.streamId;

  const video: TabCaptureConstraints = {
    mandatory: {
      chromeMediaSource: "tab",
      chromeMediaSourceId: streamId,
    },
  };

  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video,
  });
}

export function isExtensionTabCaptureAvailable(): boolean {
  return hasRuntimeApi() && hasTabCaptureApi();
}
