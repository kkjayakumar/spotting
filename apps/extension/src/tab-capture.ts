/// <reference types="chrome" />

type TabCaptureConstraints = MediaTrackConstraints & {
  mandatory?: {
    chromeMediaSource: "tab";
    chromeMediaSourceId: string;
  };
};

export async function captureCurrentTabStream(): Promise<MediaStream> {
  const streamId = await new Promise<string>((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: "SPOTTING_TAB_CAPTURE_STREAM_ID" },
      (response: { ok?: boolean; streamId?: string; error?: string }) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!response?.ok || !response.streamId) {
          reject(
            new Error(
              response?.error ??
                "Could not start tab capture for this page.",
            ),
          );
          return;
        }
        resolve(response.streamId);
      },
    );
  });

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
  return (
    typeof chrome !== "undefined" &&
    Boolean(chrome.runtime?.id) &&
    typeof chrome.tabCapture?.getMediaStreamId === "function"
  );
}
