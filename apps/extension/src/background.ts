/// <reference types="chrome" />

import {
  type ApiFetchMessage,
  proxyApiFetch,
} from "./api-proxy";

chrome.runtime.onMessage.addListener(
  (
    message: ApiFetchMessage | { type: "SPOTTING_PING_BG" },
    _sender,
    sendResponse,
  ) => {
    if (message?.type === "SPOTTING_PING_BG") {
      sendResponse({ ok: true });
      return false;
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
