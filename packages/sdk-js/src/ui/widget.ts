import {
  captureScreenshotPng,
  installCapturePipeline,
  installUserActionCapture,
  markCaptureSessionEnd,
  markCaptureSessionStart,
  setConsoleBufferLimits,
  setNetworkBufferLimits,
  setUserActionBufferLimits,
  startScreenRecording,
  type RecorderState,
} from "../capture";

// setStatus is assigned when the visible widget mounts; headless mode leaves it null.
function headlessStatus(msg: string) {
  setWidgetStatus?.(msg);
}
import { SpottingClient } from "../client";
import type { SpottingInitOptions } from "../types";

const HOST_ID = "spotting-capture-root";
const LEGACY_HOST_IDS = ["crikket-capture-root", "crikket-capture-widget"];

const ELECTRIC_BLUE = "#00BFFF";

function removeLegacyHosts() {
  if (typeof document === "undefined") return;
  for (const id of LEGACY_HOST_IDS) {
    document.getElementById(id)?.remove();
  }
}

let hostEl: HTMLDivElement | null = null;
let shadow: ShadowRoot | null = null;
let panelEl: HTMLDivElement | null = null;
let client: SpottingClient | null = null;
let recorder: RecorderState | null = null;
let destroyed = false;
let pendingRecording: Blob | null = null;
let pendingScreenshot: Blob | null = null;
let runScreenshot: (() => Promise<void>) | null = null;
let runRecordToggle: (() => Promise<void>) | null = null;
let runRecordStart: (() => Promise<void>) | null = null;
let runRecordStop: (() => Promise<void>) | null = null;
let syncRecordButtons: ((isRecording: boolean) => void) | null = null;
let syncAttachmentsUi: (() => void) | null = null;
let setWidgetStatus: ((msg: string, err?: boolean) => void) | null = null;
let dashboardBaseUrl = "http://localhost:3003";

function guessDashboardUrl(apiBaseUrl: string): string {
  try {
    const u = new URL(apiBaseUrl);
    if (u.port === "3000") {
      u.port = "3003";
    }
    return u.origin;
  } catch {
    return "http://localhost:3003";
  }
}

function formatBlobSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function styles(): string {
  return `
    :host { all: initial; }
    * { box-sizing: border-box; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
    .fab {
      position: fixed; right: 16px; bottom: 16px; z-index: 2147483646;
      padding: 10px 14px; border-radius: 999px; border: 1px solid rgba(0, 191, 255, 0.35);
      background: rgba(15, 23, 42, 0.92); color: #f8fafc; font-size: 13px; font-weight: 600;
      cursor: pointer; box-shadow: 0 8px 32px rgba(0,0,0,0.35); backdrop-filter: blur(10px);
    }
    .fab:hover { background: rgba(30, 41, 59, 0.95); }
    .panel {
      position: fixed; right: 16px; bottom: 64px; z-index: 2147483646;
      width: min(380px, calc(100vw - 32px)); max-height: min(520px, 70vh); overflow: auto;
      padding: 16px; border-radius: 16px;
      background: rgba(15, 23, 42, 0.96); color: #e2e8f0;
      border: 1px solid rgba(148, 163, 184, 0.25);
      box-shadow: 0 24px 64px rgba(0,0,0,0.45); backdrop-filter: blur(12px);
    }
    h3 { margin: 0 0 12px; font-size: 15px; color: #fff; }
    label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; margin-bottom: 4px; }
    input, textarea {
      width: 100%; margin-bottom: 10px; padding: 8px 10px; border-radius: 8px;
      border: 1px solid rgba(148, 163, 184, 0.35); background: rgba(2, 6, 23, 0.6); color: #f1f5f9; font-size: 13px;
    }
    textarea { min-height: 72px; resize: vertical; }
    .row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
    button.btn {
      flex: 1; min-width: 100px; padding: 8px 10px; border-radius: 8px; border: none; font-size: 12px; font-weight: 600; cursor: pointer;
    }
    .btn-primary { background: ${ELECTRIC_BLUE}; color: #020617; }
    .brand { color: ${ELECTRIC_BLUE}; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; margin: 0 0 8px; }
    .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
    .btn-ghost { background: rgba(148, 163, 184, 0.15); color: #e2e8f0; }
    .btn-stop { background: rgba(220, 38, 38, 0.2); color: #fecaca; }
    .hidden { display: none !important; }
    .attachments {
      display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0 4px; min-height: 0;
    }
    .attachments:empty { display: none; }
    .chip {
      display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px 4px 10px;
      border-radius: 999px; font-size: 11px; font-weight: 600;
      background: rgba(0, 191, 255, 0.15); color: #7dd3fc; border: 1px solid rgba(0, 191, 255, 0.35);
    }
    .chip button {
      all: unset; cursor: pointer; color: #94a3b8; font-size: 14px; line-height: 1;
      padding: 0 2px; border-radius: 4px;
    }
    .chip button:hover { color: #fecaca; }
    .btn-primary.ready {
      box-shadow: 0 0 0 2px rgba(0, 191, 255, 0.45);
    }
    .status { font-size: 12px; color: #94a3b8; margin-top: 8px; min-height: 1.2em; line-height: 1.45; }
    .status.ok { color: #86efac; }
    .status a { color: ${ELECTRIC_BLUE}; text-decoration: underline; }
    .err { color: #fca5a5; }
  `;
}

function mountCaptureCore(opts: SpottingInitOptions) {
  setNetworkBufferLimits(opts.maxNetworkEvents ?? 200);
  setConsoleBufferLimits(opts.maxConsoleEvents ?? 400);
  setUserActionBufferLimits(200);
  void installCapturePipeline();
  installUserActionCapture();
  dashboardBaseUrl =
    opts.dashboardUrl?.replace(/\/+$/, "") ?? guessDashboardUrl(opts.apiBaseUrl);
  client = new SpottingClient({
    publicKey: opts.publicKey,
    apiBaseUrl: opts.apiBaseUrl,
  });
}

export function mountWidget(opts: SpottingInitOptions) {
  if (typeof document === "undefined") return;
  removeLegacyHosts();
  destroyed = false;
  mountCaptureCore(opts);

  if (opts.headless) {
    return;
  }

  hostEl = document.getElementById(HOST_ID) as HTMLDivElement | null;
  if (!hostEl) {
    hostEl = document.createElement("div");
    hostEl.id = HOST_ID;
    document.documentElement.appendChild(hostEl);
  }
  shadow = hostEl.shadowRoot ?? hostEl.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = styles();
  shadow.appendChild(style);

  const fab = document.createElement("button");
  fab.type = "button";
  fab.className = "fab";
  fab.textContent = opts.buttonLabel ?? "Spotting";
  shadow.appendChild(fab);

  const panel = document.createElement("div");
  panel.className = "panel";
  panel.style.display = "none";
  panelEl = panel;
  panel.innerHTML = `
    <p class="brand">Spotting</p>
    <h3>Submit bug report</h3>
    <label>Title</label>
    <input type="text" class="title" placeholder="Short summary" />
    <label>Details</label>
    <textarea class="desc" placeholder="What went wrong?"></textarea>
    <div class="attachments" aria-live="polite"></div>
    <div class="row">
      <button type="button" class="btn btn-ghost rec">Record screen</button>
      <button type="button" class="btn btn-ghost btn-stop stop-rec hidden">Stop recording</button>
      <button type="button" class="btn btn-ghost shot">Screenshot</button>
    </div>
    <div class="row">
      <button type="button" class="btn btn-primary submit">Send report</button>
    </div>
    <div class="status"></div>
  `;
  shadow.appendChild(panel);

  const $ = <T extends HTMLElement>(sel: string) => panel.querySelector(sel) as T;
  const statusEl = $(".status");
  const attachmentsEl = $(".attachments");
  const submitBtn = $(".btn.submit") as HTMLButtonElement;

  const setStatus = (msg: string, err = false, ok = false) => {
    statusEl.textContent = msg;
    statusEl.className = err ? "status err" : ok ? "status ok" : "status";
  };
  setWidgetStatus = (msg, err) => setStatus(msg, err);

  syncAttachmentsUi = () => {
    attachmentsEl.innerHTML = "";
    const parts: string[] = [];

    if (pendingRecording && pendingRecording.size > 0) {
      parts.push("recording");
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.innerHTML = `Recording · ${formatBlobSize(pendingRecording.size)} <button type="button" title="Remove recording" aria-label="Remove recording">×</button>`;
      chip.querySelector("button")?.addEventListener("click", () => {
        pendingRecording = null;
        syncAttachmentsUi?.();
        setStatus("Recording removed.");
      });
      attachmentsEl.appendChild(chip);
    }

    if (pendingScreenshot && pendingScreenshot.size > 0) {
      parts.push("screenshot");
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.innerHTML = `Screenshot · ${formatBlobSize(pendingScreenshot.size)} <button type="button" title="Remove screenshot" aria-label="Remove screenshot">×</button>`;
      chip.querySelector("button")?.addEventListener("click", () => {
        pendingScreenshot = null;
        syncAttachmentsUi?.();
        setStatus("Screenshot removed.");
      });
      attachmentsEl.appendChild(chip);
    }

    const count = parts.length;
    submitBtn.textContent =
      count > 0 ? `Send report (${count} attached)` : "Send report";
    submitBtn.classList.toggle("ready", count > 0);

    if (count > 0 && !recorder) {
      const labels = parts.map((p) => (p === "recording" ? "recording" : "screenshot"));
      setStatus(
        `${labels.join(" and ")} attached — add a title and click Send report.`,
      );
    }
  };

  fab.addEventListener("click", () => {
    panel.style.display = panel.style.display === "none" ? "block" : "none";
  });

  syncRecordButtons = (isRecording: boolean) => {
    const recBtn = $(".btn.rec") as HTMLButtonElement;
    const stopBtn = $(".btn.stop-rec") as HTMLButtonElement;
    recBtn.classList.toggle("hidden", isRecording);
    stopBtn.classList.toggle("hidden", !isRecording);
  };

  const startRecording = async () => {
    if (!client || recorder) return;
    markCaptureSessionStart();
    setStatus("Select a tab or window to share…");
    recorder = await startScreenRecording();
    syncRecordButtons?.(true);
    setStatus("Recording… click Stop recording when finished.");
  };

  const stopRecording = async () => {
    if (!client || !recorder) return;
    setStatus("Stopping recording…");
    const blob = await recorder.stop();
    markCaptureSessionEnd();
    recorder = null;
    pendingRecording = blob;
    syncRecordButtons?.(false);
    syncAttachmentsUi?.();
    if (!blob || blob.size === 0) {
      setStatus("Recording was empty — try again.", true);
    }
  };

  runRecordStart = async () => {
    if (!client) return;
    try {
      await startRecording();
    } catch (e) {
      recorder = null;
      syncRecordButtons?.(false);
      setStatus(e instanceof Error ? e.message : "Recording failed", true);
      throw e;
    }
  };

  runRecordStop = async () => {
    if (!client || !recorder) return;
    try {
      await stopRecording();
    } catch (e) {
      recorder = null;
      syncRecordButtons?.(false);
      setStatus(e instanceof Error ? e.message : "Recording failed", true);
      throw e;
    }
  };

  runRecordToggle = async () => {
    if (!client) return;
    if (recorder) {
      await runRecordStop?.();
      return;
    }
    await runRecordStart?.();
  };

  runScreenshot = async () => {
    setStatus("Choose a tab or window in the picker…");
    try {
      const png = await captureScreenshotPng();
      pendingScreenshot = png;
      syncAttachmentsUi?.();
      if (!png) {
        setStatus("Screenshot cancelled.", true);
      }
    } catch (e) {
      pendingScreenshot = null;
      syncAttachmentsUi?.();
      setStatus(e instanceof Error ? e.message : "Screenshot failed", true);
    }
  };

  $(".btn.rec").addEventListener("click", () => {
    void runRecordStart?.();
  });

  $(".btn.stop-rec").addEventListener("click", () => {
    void runRecordStop?.();
  });

  $(".btn.shot").addEventListener("click", () => {
    void runScreenshot?.();
  });

  $(".btn.submit").addEventListener("click", async () => {
    if (!client || destroyed) return;
    const title = ($(".title") as HTMLInputElement).value.trim();
    const description = ($(".desc") as HTMLTextAreaElement).value.trim();
    if (!title) {
      setStatus("Title is required.", true);
      return;
    }
    submitBtn.disabled = true;
    setStatus("Creating report…");
    try {
      const recordingBlob = pendingRecording;
      const screenshotBlob = pendingScreenshot;
      const metadata = client.buildMetadata({
        recordingMimeType: recordingBlob?.type,
      });
      const { id: reportId } = await client.createReport({
        title,
        description: description || undefined,
        pageUrl:
          typeof location !== "undefined" ? location.href : undefined,
        metadata,
      });

      if (screenshotBlob && screenshotBlob.size > 0) {
        setStatus("Uploading screenshot…");
        await client.uploadArtifact(reportId, screenshotBlob, "screenshot.png");
      }
      if (recordingBlob && recordingBlob.size > 0) {
        setStatus("Uploading recording…");
        await client.uploadArtifact(
          reportId,
          recordingBlob,
          `recording.${recordingBlob.type.includes("webm") ? "webm" : "bin"}`,
        );
      }

      const reportUrl = `${dashboardBaseUrl}/s/${reportId}`;
      statusEl.innerHTML = `Sent! <a href="${reportUrl}" target="_blank" rel="noopener noreferrer">View report</a> or open your dashboard.`;
      statusEl.className = "status ok";
      ($(".title") as HTMLInputElement).value = "";
      ($(".desc") as HTMLTextAreaElement).value = "";
      pendingRecording = null;
      pendingScreenshot = null;
      recorder = null;
      syncRecordButtons?.(false);
      syncAttachmentsUi?.();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Submit failed", true);
    } finally {
      submitBtn.disabled = false;
    }
  });

  syncAttachmentsUi();
}

export type WidgetRecordingState = {
  isRecording: boolean;
  hasPendingRecording: boolean;
};

export function getWidgetRecordingState(): WidgetRecordingState {
  return {
    isRecording: recorder !== null,
    hasPendingRecording: Boolean(pendingRecording && pendingRecording.size > 0),
  };
}

export async function startWidgetRecording() {
  if (!runRecordStart && !client) {
    throw new Error("Spotting is not mounted on this page.");
  }
  if (runRecordStart) {
    await runRecordStart();
  } else {
    markCaptureSessionStart();
    headlessStatus("Select a tab or window to share…");
    recorder = await startScreenRecording();
    syncRecordButtons?.(true);
  }
  if (panelEl) openWidgetPanel();
}

export async function stopWidgetRecording() {
  if (!runRecordStop && !client) {
    throw new Error("Spotting is not mounted on this page.");
  }
  if (runRecordStop) {
    await runRecordStop();
  } else if (recorder) {
    headlessStatus("Stopping recording…");
    const blob = await recorder.stop();
    markCaptureSessionEnd();
    recorder = null;
    pendingRecording = blob;
    syncRecordButtons?.(false);
    syncAttachmentsUi?.();
  }
  if (panelEl) openWidgetPanel();
}

export function openWidgetPanel() {
  if (panelEl) {
    panelEl.style.display = "block";
  }
}

export async function triggerWidgetScreenshot() {
  if (runScreenshot) {
    await runScreenshot();
  } else if (client) {
    headlessStatus("Choose a tab or window in the picker…");
    const png = await captureScreenshotPng();
    pendingScreenshot = png;
    syncAttachmentsUi?.();
  }
  if (panelEl) openWidgetPanel();
}

export async function triggerWidgetRecordToggle() {
  if (runRecordToggle) {
    await runRecordToggle();
  }
  if (panelEl) openWidgetPanel();
}

export type PendingCaptureState = {
  hasPendingRecording: boolean;
  hasPendingScreenshot: boolean;
  recordingSize: number;
  screenshotSize: number;
  isRecording: boolean;
};

export function getPendingCaptureState(): PendingCaptureState {
  return {
    hasPendingRecording: Boolean(pendingRecording && pendingRecording.size > 0),
    hasPendingScreenshot: Boolean(pendingScreenshot && pendingScreenshot.size > 0),
    recordingSize: pendingRecording?.size ?? 0,
    screenshotSize: pendingScreenshot?.size ?? 0,
    isRecording: recorder !== null,
  };
}

export async function submitWidgetReport(input: {
  title: string;
  description?: string;
}): Promise<{ reportId: string; reportUrl: string }> {
  if (!client || destroyed) {
    throw new Error("Spotting is not mounted on this page.");
  }
  const title = input.title.trim();
  if (!title) {
    throw new Error("Title is required.");
  }
  const recordingBlob = pendingRecording;
  const screenshotBlob = pendingScreenshot;
  const metadata = client.buildMetadata({
    recordingMimeType: recordingBlob?.type,
  });
  const { id: reportId } = await client.createReport({
    title,
    description: input.description?.trim() || undefined,
    pageUrl: typeof location !== "undefined" ? location.href : undefined,
    metadata,
  });
  if (screenshotBlob && screenshotBlob.size > 0) {
    await client.uploadArtifact(reportId, screenshotBlob, "screenshot.png");
  }
  if (recordingBlob && recordingBlob.size > 0) {
    await client.uploadArtifact(
      reportId,
      recordingBlob,
      `recording.${recordingBlob.type.includes("webm") ? "webm" : "bin"}`,
    );
  }
  pendingRecording = null;
  pendingScreenshot = null;
  recorder = null;
  syncRecordButtons?.(false);
  syncAttachmentsUi?.();
  const reportUrl = `${dashboardBaseUrl}/s/${reportId}`;
  return { reportId, reportUrl };
}

export function destroyWidget() {
  removeLegacyHosts();
  destroyed = true;
  recorder = null;
  pendingRecording = null;
  pendingScreenshot = null;
  client = null;
  panelEl = null;
  runScreenshot = null;
  runRecordToggle = null;
  runRecordStart = null;
  runRecordStop = null;
  syncRecordButtons = null;
  syncAttachmentsUi = null;
  setWidgetStatus = null;
  if (hostEl?.parentNode) {
    hostEl.parentNode.removeChild(hostEl);
  }
  hostEl = null;
  shadow = null;
}
