/// <reference types="chrome" />

import type { MountMessage } from "../content";
import {
  dashboardHomeUrl,
  isExtensionConfigured,
  loadExtensionSettings,
  normalizeApiBaseUrl,
  saveExtensionSettings,
  validateApiBaseUrl,
  validatePublicKey,
} from "../storage";
import { testApiHealth } from "../api-proxy";
import {
  getActiveTab,
  restrictedPageMessage,
  sendToActiveTab,
} from "../tab-bridge";

const viewSetup = document.getElementById("view-setup")!;
const viewHome = document.getElementById("view-home")!;
const apiEl = document.getElementById("api") as HTMLInputElement;
const dashboardEl = document.getElementById("dashboard") as HTMLInputElement;
const keyEl = document.getElementById("key") as HTMLInputElement;
const statusSetupEl = document.getElementById("status-setup")!;
const statusEl = document.getElementById("status")!;
const saveBtn = document.getElementById("save") as HTMLButtonElement;
const homeBtn = document.getElementById("home") as HTMLButtonElement;
const settingsBtn = document.getElementById("settings") as HTMLButtonElement;
const actionScreenshot = document.getElementById(
  "action-screenshot",
) as HTMLButtonElement;
const actionRecord = document.getElementById(
  "action-record",
) as HTMLButtonElement;
const actionStopRecord = document.getElementById(
  "action-stop-record",
) as HTMLButtonElement;
const recordBadge = document.getElementById("record-badge")!;
const actionReport = document.getElementById(
  "action-report",
) as HTMLButtonElement;
const submitPanel = document.getElementById("submit-panel")!;
const reportTitleEl = document.getElementById("report-title") as HTMLInputElement;
const reportDescEl = document.getElementById("report-desc") as HTMLTextAreaElement;
const attachmentsHintEl = document.getElementById("attachments-hint")!;
const actionSend = document.getElementById("action-send") as HTMLButtonElement;
const actionCancelSubmit = document.getElementById(
  "action-cancel-submit",
) as HTMLButtonElement;

const homeActions = [
  actionScreenshot,
  actionRecord,
  actionStopRecord,
  actionReport,
  document.querySelector("#view-home .divider") as HTMLElement,
].filter(Boolean);

let settings = {
  apiBaseUrl: "http://localhost:3000",
  publicKey: "",
  dashboardUrl: "http://localhost:3003",
};

function showView(which: "setup" | "home") {
  viewSetup.classList.toggle("hidden", which !== "setup");
  viewHome.classList.toggle("hidden", which !== "home");
}

function setSetupStatus(msg: string, err = false) {
  statusSetupEl.textContent = msg;
  statusSetupEl.className = err ? "hint err" : "hint";
}

function setStatus(msg: string, err = false) {
  statusEl.textContent = msg;
  statusEl.className = err ? "hint err" : "hint";
}

function mountPayload(): MountMessage {
  return {
    type: "SPOTTING_MOUNT",
    publicKey: settings.publicKey,
    apiBaseUrl: settings.apiBaseUrl,
    dashboardUrl: settings.dashboardUrl,
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function setSubmitPanelVisible(visible: boolean) {
  submitPanel.classList.toggle("hidden", !visible);
  for (const el of homeActions) {
    el.classList.toggle("hidden", visible);
  }
}

function syncAttachmentsHint(state: {
  hasPendingRecording?: boolean;
  hasPendingScreenshot?: boolean;
  recordingSize?: number;
  screenshotSize?: number;
}) {
  const parts: string[] = [];
  if (state.hasPendingRecording) {
    parts.push(`Recording (${formatBytes(state.recordingSize ?? 0)})`);
  }
  if (state.hasPendingScreenshot) {
    parts.push(`Screenshot (${formatBytes(state.screenshotSize ?? 0)})`);
  }
  attachmentsHintEl.textContent =
    parts.length > 0
      ? `Attached: ${parts.join(" · ")}`
      : "Attach a recording or screenshot first.";
}

async function persistFromForm(): Promise<boolean> {
  const apiError = validateApiBaseUrl(apiEl.value);
  if (apiError) {
    setSetupStatus(apiError, true);
    return false;
  }
  const keyError = validatePublicKey(keyEl.value.trim());
  if (keyError) {
    setSetupStatus(keyError, true);
    return false;
  }

  const { url: apiBaseUrl, corrected } = normalizeApiBaseUrl(apiEl.value);
  const dashboardUrl =
    dashboardEl.value.trim() || "http://localhost:3003";
  const publicKey = keyEl.value.trim();

  apiEl.value = apiBaseUrl;
  settings = { apiBaseUrl, publicKey, dashboardUrl };

  try {
    await saveExtensionSettings(settings);
    setSetupStatus(
      corrected
        ? "Saved. API URL corrected to port 3000."
        : "Saved. Opening capture menu…",
    );
    return true;
  } catch {
    setSetupStatus("Save failed — check extension permissions.", true);
    return false;
  }
}

function setRecordingUi(isRecording: boolean) {
  actionRecord.classList.toggle("hidden", isRecording);
  actionStopRecord.classList.toggle("hidden", !isRecording);
  recordBadge.textContent = isRecording ? "On" : "Off";
  recordBadge.classList.toggle("recording", isRecording);
}

async function checkApiConnection(): Promise<boolean> {
  const health = await testApiHealth(settings.apiBaseUrl);
  if (!health.ok) {
    setStatus(health.message, true);
    return false;
  }
  return true;
}

async function refreshCaptureState() {
  const res = await sendToActiveTab({ type: "SPOTTING_CAPTURE_STATE" });
  if (!res.ok) return;
  setRecordingUi(Boolean(res.isRecording));
  syncAttachmentsHint(res);
  if (res.isRecording) {
    setStatus("Recording — use Stop recording, then Send bug report.");
  } else if (res.hasPendingRecording || res.hasPendingScreenshot) {
    setStatus("Ready to send — open Send bug report.");
  }
}

async function load() {
  try {
    settings = await loadExtensionSettings();
    apiEl.value = settings.apiBaseUrl;
    dashboardEl.value = settings.dashboardUrl;
    keyEl.value = settings.publicKey;
    const configured = isExtensionConfigured(settings);
    showView(configured ? "home" : "setup");
    if (configured) {
      const tab = await getActiveTab();
      const restricted = restrictedPageMessage(tab?.url);
      if (restricted) {
        setStatus(restricted, true);
      } else {
        await checkApiConnection();
        await refreshCaptureState();
      }
    }
  } catch {
    showView("setup");
    setSetupStatus("Could not load settings.", true);
  }
}

saveBtn.addEventListener("click", async () => {
  const saved = await persistFromForm();
  if (saved) {
    showView("home");
    setStatus("Ready — record or capture, then send from the extension.");
  }
});

homeBtn.addEventListener("click", () => {
  const url = dashboardHomeUrl(settings.dashboardUrl);
  void chrome.tabs.create({ url });
});

settingsBtn.addEventListener("click", () => {
  showView("setup");
  setSubmitPanelVisible(false);
  setSetupStatus("Update your API key or dashboard URL.");
});

actionScreenshot.addEventListener("click", async () => {
  setStatus("Capturing…");
  actionScreenshot.disabled = true;
  const res = await sendToActiveTab({
    ...mountPayload(),
    type: "SPOTTING_SCREENSHOT",
  });
  if (res.ok) {
    syncAttachmentsHint(res);
    setStatus("Screenshot attached — open Send bug report.");
  } else {
    setStatus(res.error ?? "Failed.", true);
  }
  actionScreenshot.disabled = false;
});

actionRecord.addEventListener("click", async () => {
  setStatus("Starting recording… pick a tab or window to share.");
  actionRecord.disabled = true;
  const res = await sendToActiveTab({
    ...mountPayload(),
    type: "SPOTTING_START_RECORD",
  });
  if (res.ok) {
    setRecordingUi(Boolean(res.isRecording));
    syncAttachmentsHint(res);
    setStatus(
      res.isRecording
        ? "Recording — click Stop recording when finished."
        : "Recording started.",
    );
  } else {
    setStatus(res.error ?? "Failed.", true);
  }
  actionRecord.disabled = false;
});

actionStopRecord.addEventListener("click", async () => {
  setStatus("Stopping recording…");
  actionStopRecord.disabled = true;
  const res = await sendToActiveTab({
    ...mountPayload(),
    type: "SPOTTING_STOP_RECORD",
  });
  if (res.ok) {
    setRecordingUi(false);
    syncAttachmentsHint(res);
    setStatus(
      res.hasPendingRecording
        ? "Recording saved — open Send bug report."
        : "Recording stopped.",
    );
  } else {
    setStatus(res.error ?? "Failed.", true);
  }
  actionStopRecord.disabled = false;
});

actionReport.addEventListener("click", async () => {
  const res = await sendToActiveTab({ type: "SPOTTING_CAPTURE_STATE" });
  if (!res.ok) {
    setStatus(res.error ?? "Failed.", true);
    return;
  }
  syncAttachmentsHint(res);
  if (!(res.hasPendingRecording || res.hasPendingScreenshot)) {
    setStatus("Record or screenshot first, then send.", true);
    return;
  }
  setSubmitPanelVisible(true);
  setStatus("Add a title and send — the page stays clear.");
});

actionCancelSubmit.addEventListener("click", () => {
  setSubmitPanelVisible(false);
  void refreshCaptureState();
});

actionSend.addEventListener("click", async () => {
  const title = reportTitleEl.value.trim();
  if (!title) {
    setStatus("Title is required.", true);
    return;
  }
  actionSend.disabled = true;
  setStatus("Checking API connection…");
  if (!(await checkApiConnection())) {
    actionSend.disabled = false;
    return;
  }
  setStatus("Sending report…");
  const res = await sendToActiveTab({
    ...mountPayload(),
    type: "SPOTTING_SUBMIT_REPORT",
    title,
    description: reportDescEl.value.trim() || undefined,
  });
  if (res.ok && res.reportUrl) {
    setStatus("Report sent!");
    reportTitleEl.value = "";
    reportDescEl.value = "";
    setSubmitPanelVisible(false);
    void chrome.tabs.create({ url: res.reportUrl });
    await refreshCaptureState();
  } else {
    setStatus(res.error ?? "Send failed.", true);
  }
  actionSend.disabled = false;
});

void load();
