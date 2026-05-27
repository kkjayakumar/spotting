/// <reference types="chrome" />

import {
  type ApiFetchMessage,
  proxyApiFetch,
} from "./api-proxy";

chrome.runtime.onMessage.addListener(
  (
    message:
      | ApiFetchMessage
      | { type: "SPOTTING_PING_BG" }
      | { type: "SPOTTING_TAB_CAPTURE_STREAM_ID" },
    sender,
    sendResponse,
  ) => {
    if (message?.type === "SPOTTING_PING_BG") {
      sendResponse({ ok: true });
      return false;
    }

    if (message?.type === "SPOTTING_TAB_CAPTURE_STREAM_ID") {
      const tabId = sender.tab?.id;
      if (!tabId) {
        sendResponse({ ok: false, error: "No active tab for capture." });
        return false;
      }

      chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (streamId) => {
        if (chrome.runtime.lastError || !streamId) {
          sendResponse({
            ok: false,
            error:
              chrome.runtime.lastError?.message ??
              "Tab capture is not available on this page.",
          });
          return;
        }
        sendResponse({ ok: true, streamId });
      });
      return true;
    }

    if (message?.type !== "SPOTTING_API_FETCH") {
      return false;
    }

    void proxyApiFetch(message).then(sendResponse);
    return true;
  },
);

chrome.runtime.onInstalled.addListener(() => {
  /* extension installed or updated */
});

export {};
