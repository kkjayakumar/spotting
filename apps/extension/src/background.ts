/// <reference types="chrome" />

import {
  type ApiFetchMessage,
  proxyApiFetch,
} from "./api-proxy";
import {
  addRuntimeInstalledListener,
  addRuntimeMessageListener,
  tabCaptureGetMediaStreamId,
} from "./browser-api";

addRuntimeMessageListener(
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

      void tabCaptureGetMediaStreamId(tabId).then((streamId) => {
        if (!streamId) {
          sendResponse({
            ok: false,
            error: "Tab capture is not available on this page.",
          });
          return;
        }
        sendResponse({ ok: true, streamId });
      }).catch((error) => {
        sendResponse({
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Tab capture is not available on this page.",
        });
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

addRuntimeInstalledListener(() => {
  /* extension installed or updated */
});

export {};
