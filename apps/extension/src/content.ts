/// <reference types="chrome" />

import {
  destroy,
  getPendingCaptureState,
  getWidgetRecordingState,
  init,
  startWidgetRecording,
  stopWidgetRecording,
  submitWidgetReport,
  triggerWidgetScreenshot,
} from "@spotting/sdk-js";

import { installExtensionFetchBridge } from "./extension-fetch-bridge";

export type MountPayload = {
  publicKey: string;
  apiBaseUrl: string;
  dashboardUrl?: string;
};

export type MountMessage = { type: "SPOTTING_MOUNT" } & MountPayload;

export type UnmountMessage = { type: "SPOTTING_UNMOUNT" };

export type OpenPanelMessage = { type: "SPOTTING_OPEN_PANEL" } & MountPayload;
export type ScreenshotMessage = { type: "SPOTTING_SCREENSHOT" } & MountPayload;
export type RecordMessage = { type: "SPOTTING_TOGGLE_RECORD" } & MountPayload;
export type StartRecordMessage = { type: "SPOTTING_START_RECORD" } & MountPayload;
export type StopRecordMessage = { type: "SPOTTING_STOP_RECORD" } & MountPayload;
export type RecordStateMessage = { type: "SPOTTING_RECORD_STATE" };
export type CaptureStateMessage = { type: "SPOTTING_CAPTURE_STATE" };
export type SubmitReportMessage = {
  type: "SPOTTING_SUBMIT_REPORT";
  title: string;
  description?: string;
} & MountPayload;
export type PingMessage = { type: "SPOTTING_PING" };

type ContentMessage =
  | MountMessage
  | UnmountMessage
  | OpenPanelMessage
  | ScreenshotMessage
  | RecordMessage
  | StartRecordMessage
  | StopRecordMessage
  | RecordStateMessage
  | CaptureStateMessage
  | SubmitReportMessage
  | PingMessage;

const CONTENT_SCRIPT_KEY = "__SPOTTING_CONTENT_SCRIPT_V1__";

function registerContentScript() {
  let mounted = false;
  let mountConfig: MountPayload | null = null;

  async function ensureMounted(message: MountPayload) {
    mountConfig = message;
    if (!mounted) {
      destroy();
      init({
        publicKey: message.publicKey.trim(),
        apiBaseUrl: message.apiBaseUrl.replace(/\/+$/, ""),
        dashboardUrl: message.dashboardUrl?.replace(/\/+$/, ""),
        headless: true,
      });
      mounted = true;
    }
  }

  chrome.runtime.onMessage.addListener(
    (message: ContentMessage, _sender, sendResponse) => {
      if (message.type === "SPOTTING_PING") {
        sendResponse({ ok: true });
        return true;
      }

      if (message.type === "SPOTTING_UNMOUNT") {
        destroy();
        mounted = false;
        mountConfig = null;
        sendResponse({ ok: true });
        return true;
      }

      if (message.type === "SPOTTING_MOUNT") {
        void ensureMounted(message).then(() => sendResponse({ ok: true }));
        return true;
      }

      if (
        message.type === "SPOTTING_RECORD_STATE" ||
        message.type === "SPOTTING_CAPTURE_STATE"
      ) {
        const recording = mounted
          ? getWidgetRecordingState()
          : { isRecording: false, hasPendingRecording: false };
        const pending = mounted ? getPendingCaptureState() : null;
        sendResponse({
          ok: true,
          ...recording,
          ...(pending ?? {
            hasPendingScreenshot: false,
            recordingSize: 0,
            screenshotSize: 0,
          }),
        });
        return true;
      }

      if (
        message.type === "SPOTTING_SCREENSHOT" ||
        message.type === "SPOTTING_START_RECORD" ||
        message.type === "SPOTTING_STOP_RECORD"
      ) {
        void ensureMounted(message).then(async () => {
          try {
            if (message.type === "SPOTTING_SCREENSHOT") {
              await triggerWidgetScreenshot();
            } else if (message.type === "SPOTTING_START_RECORD") {
              await startWidgetRecording();
            } else if (message.type === "SPOTTING_STOP_RECORD") {
              await stopWidgetRecording();
            }
            sendResponse({
              ok: true,
              ...getWidgetRecordingState(),
              ...getPendingCaptureState(),
            });
          } catch (e) {
            sendResponse({
              ok: false,
              error: e instanceof Error ? e.message : "Action failed",
            });
          }
        });
        return true;
      }

      if (message.type === "SPOTTING_SUBMIT_REPORT") {
        void ensureMounted(message).then(async () => {
          try {
            const result = await submitWidgetReport({
              title: message.title,
              description: message.description,
            });
            sendResponse({ ok: true, ...result });
          } catch (e) {
            sendResponse({
              ok: false,
              error: e instanceof Error ? e.message : "Submit failed",
            });
          }
        });
        return true;
      }

      return false;
    },
  );
}

if (!(globalThis as Record<string, unknown>)[CONTENT_SCRIPT_KEY]) {
  (globalThis as Record<string, unknown>)[CONTENT_SCRIPT_KEY] = true;
  installExtensionFetchBridge();
  registerContentScript();
}

export {};
