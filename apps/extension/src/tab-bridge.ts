/// <reference types="chrome" />

import {
  hasScriptingApi,
  scriptingExecuteScript,
  tabsQuery,
  tabsSendMessage,
} from "./browser-api";

export type TabMessageResult = {
  ok: boolean;
  error?: string;
  isRecording?: boolean;
  hasPendingRecording?: boolean;
  hasPendingScreenshot?: boolean;
  recordingSize?: number;
  screenshotSize?: number;
  reportId?: string;
  reportUrl?: string;
};

export type ActiveTab = {
  id: number;
  url?: string;
};

export async function getActiveTab(): Promise<ActiveTab | null> {
  const [tab] = await tabsQuery({ active: true, currentWindow: true });
  if (!tab?.id) return null;
  return { id: tab.id, url: tab.url };
}

export function restrictedPageMessage(url: string | undefined): string | null {
  if (!url) {
    return "This tab has no URL yet. Load a website, then try again.";
  }
  if (
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("moz-extension://") ||
    url.startsWith("safari-web-extension://") ||
    url.startsWith("edge://") ||
    url.startsWith("about:") ||
    url.startsWith("devtools://")
  ) {
    return "Spotting cannot run on browser pages. Switch to a normal website (http:// or https://).";
  }
  if (url.startsWith("file://")) {
    return "Spotting cannot run on file:// pages.";
  }
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return "Spotting only works on http:// and https:// pages.";
  }
  return null;
}

async function pingContentScript(tabId: number): Promise<boolean> {
  try {
    const res = (await tabsSendMessage(tabId, {
      type: "SPOTTING_PING",
    })) as { ok?: boolean };
    return res?.ok === true;
  } catch {
    return false;
  }
}

async function injectContentScript(tabId: number): Promise<void> {
  if (!hasScriptingApi()) {
    return;
  }
  const firstInjection: any = {
    target: { tabId },
    files: ["page-capture.js"],
    // Page capture must run in MAIN world on all supported browsers.
    world: "MAIN",
  };
  await scriptingExecuteScript(firstInjection);
  await scriptingExecuteScript({
    target: { tabId },
    files: ["content.js"],
  });
}

async function ensureContentScript(tabId: number): Promise<void> {
  if (await pingContentScript(tabId)) {
    return;
  }
  await injectContentScript(tabId);
  // Allow the injected script to register its message listener.
  await new Promise((resolve) => setTimeout(resolve, 80));
  if (!(await pingContentScript(tabId))) {
    throw new Error("CONTENT_SCRIPT_UNAVAILABLE");
  }
}

/**
 * Send a message to the active tab's content script, injecting it first if needed.
 */
export async function sendToActiveTab<T extends { type: string }>(
  message: T,
): Promise<TabMessageResult> {
  const tab = await getActiveTab();
  if (!tab) {
    return { ok: false, error: "No active tab." };
  }

  const restricted = restrictedPageMessage(tab.url);
  if (restricted) {
    return { ok: false, error: restricted };
  }

  try {
    await ensureContentScript(tab.id);
    return (await tabsSendMessage(tab.id, message)) as TabMessageResult;
  } catch (err) {
    if (err instanceof Error && err.message === "CONTENT_SCRIPT_UNAVAILABLE") {
      return {
        ok: false,
        error:
          "Could not start Spotting on this tab. Reload the page, then open the extension again.",
      };
    }
    const detail = err instanceof Error ? err.message : String(err);
    if (/cannot access|extension manifest|restricted/i.test(detail)) {
      return {
        ok: false,
        error:
          "This page blocks extensions. Try another tab or reload the website.",
      };
    }
    return {
      ok: false,
      error:
        "Spotting is not connected to this tab. Reload the page, then try again.",
    };
  }
}
