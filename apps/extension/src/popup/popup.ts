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
  fetchExtensionProjects,
  loadSelectedProjectId,
  saveSelectedProjectId,
  type ExtensionProject,
} from "../projects";
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
const projectSelectEl = document.getElementById(
  "project-select",
) as HTMLSelectElement;
const reportTitleEl = document.getElementById(
  "report-title",
) as HTMLInputElement;
const sendReportBtn = document.getElementById(
  "send-report",
) as HTMLButtonElement;

let settings = {
  apiBaseUrl: "http://localhost:3000",
  publicKey: "",
  dashboardUrl: "http://localhost:3001",
};

let projects: ExtensionProject[] = [];
let isSendingReport = false;
let hasPendingCapture = false;
let lastPolledCaptureKey = "";

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

function setCaptureActionsDisabled(disabled: boolean) {
  actionScreenshot.disabled = disabled;
  actionRecord.disabled = disabled;
  actionStopRecord.disabled = disabled;
}

function updateSendUi() {
  const title = reportTitleEl.value.trim();
  const canSend = hasPendingCapture && title.length > 0 && !isSendingReport;
  sendReportBtn.classList.toggle("hidden", !hasPendingCapture);
  sendReportBtn.disabled = !canSend;
  reportTitleEl.disabled = isSendingReport;
}

function renderProjectOptions(selectedProjectId: string | null) {
  projectSelectEl.innerHTML = "";
  const noneOption = document.createElement("option");
  noneOption.value = "";
  noneOption.textContent = "No project";
  projectSelectEl.appendChild(noneOption);

  for (const project of projects) {
    const option = document.createElement("option");
    option.value = project.id;
    option.textContent = project.name;
    projectSelectEl.appendChild(option);
  }

  projectSelectEl.value = selectedProjectId ?? "";
}

async function loadProjects() {
  try {
    projects = await fetchExtensionProjects({
      apiBaseUrl: settings.apiBaseUrl,
      publicKey: settings.publicKey,
    });
    const selectedProjectId = await loadSelectedProjectId();
    renderProjectOptions(selectedProjectId);
  } catch (error) {
    projects = [];
    renderProjectOptions(await loadSelectedProjectId());
    setStatus(
      error instanceof Error
        ? error.message
        : "Could not load projects — reports will save without a project.",
      true,
    );
  }
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
    dashboardEl.value.trim() || "http://localhost:3001";
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

async function suggestedReportTitle(): Promise<string> {
  const tab = await getActiveTab();
  let host = "page";
  if (tab?.url) {
    try {
      host = new URL(tab.url).hostname;
    } catch {
      /* ignore */
    }
  }
  const when = new Date().toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
  return `Bug report — ${host} — ${when}`;
}

async function maybePrefillReportTitle() {
  if (reportTitleEl.value.trim().length > 0) {
    return;
  }
  reportTitleEl.value = await suggestedReportTitle();
}

function pendingCaptureLabel(
  hasRecording: boolean,
  hasScreenshot: boolean,
): string {
  if (hasRecording && hasScreenshot) {
    return "Recording and screenshot ready — edit the title and send.";
  }
  if (hasRecording) {
    return "Recording ready — edit the title and send.";
  }
  if (hasScreenshot) {
    return "Screenshot ready — edit the title and send.";
  }
  return "Add a title, then send your report.";
}

async function submitCapture(): Promise<boolean> {
  const title = reportTitleEl.value.trim();
  if (!title) {
    setStatus("Enter a report title before sending.", true);
    reportTitleEl.focus();
    return false;
  }

  if (isSendingReport) {
    return false;
  }

  isSendingReport = true;
  setCaptureActionsDisabled(true);
  updateSendUi();
  setStatus("Sending report…");

  try {
    if (!(await checkApiConnection())) {
      return false;
    }

    const state = await sendToActiveTab({ type: "SPOTTING_CAPTURE_STATE" });
    if (
      !state.ok ||
      !(state.hasPendingRecording || state.hasPendingScreenshot)
    ) {
      setStatus("Nothing to send — capture a screenshot or recording first.", true);
      hasPendingCapture = false;
      updateSendUi();
      return false;
    }

    const res = await sendToActiveTab({
      ...mountPayload(),
      type: "SPOTTING_SUBMIT_REPORT",
      title,
    });

    if (res.ok && res.reportUrl) {
      setStatus("Report sent!");
      reportTitleEl.value = "";
      hasPendingCapture = false;
      lastPolledCaptureKey = "";
      void chrome.tabs.create({ url: res.reportUrl });
      await refreshCaptureState();
      return true;
    }

    setStatus(res.error ?? "Send failed.", true);
    return false;
  } finally {
    isSendingReport = false;
    setCaptureActionsDisabled(false);
    updateSendUi();
  }
}

async function refreshCaptureState() {
  const res = await sendToActiveTab({ type: "SPOTTING_CAPTURE_STATE" });
  if (!res.ok) return;
  setRecordingUi(Boolean(res.isRecording));
  if (res.isRecording) {
    hasPendingCapture = false;
    updateSendUi();
    setStatus(
      "Recording — click Stop recording in the extension when finished (not the browser Stop sharing button).",
    );
    return;
  }

  const captureKey = `${res.recordingSize ?? 0}:${res.screenshotSize ?? 0}`;
  const pending = Boolean(res.hasPendingRecording || res.hasPendingScreenshot);
  hasPendingCapture = pending;

  if (!pending) {
    lastPolledCaptureKey = "";
    updateSendUi();
    return;
  }

  if (captureKey !== lastPolledCaptureKey) {
    lastPolledCaptureKey = captureKey;
    await maybePrefillReportTitle();
    setStatus(
      pendingCaptureLabel(
        Boolean(res.hasPendingRecording),
        Boolean(res.hasPendingScreenshot),
      ),
    );
  }

  updateSendUi();
}

let captureStatePoll: number | undefined;

function startCaptureStatePoll() {
  if (captureStatePoll !== undefined) {
    return;
  }
  captureStatePoll = window.setInterval(() => {
    void refreshCaptureState();
  }, 1500);
}

function stopCaptureStatePoll() {
  if (captureStatePoll === undefined) {
    return;
  }
  window.clearInterval(captureStatePoll);
  captureStatePoll = undefined;
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
        await loadProjects();
        await refreshCaptureState();
        startCaptureStatePoll();
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
    setStatus(
      "Ready — pick a project, capture, then add a title and send your report.",
    );
    await loadProjects();
    startCaptureStatePoll();
  }
});

homeBtn.addEventListener("click", () => {
  const url = dashboardHomeUrl(settings.dashboardUrl);
  void chrome.tabs.create({ url });
});

settingsBtn.addEventListener("click", () => {
  stopCaptureStatePoll();
  showView("setup");
  setSetupStatus("Update your API key or dashboard URL.");
});

projectSelectEl.addEventListener("change", () => {
  const projectId = projectSelectEl.value || null;
  void saveSelectedProjectId(projectId);
  const projectName = projects.find((project) => project.id === projectId)?.name;
  if (projectName) {
    setStatus(`New captures will save to ${projectName}.`);
  } else {
    setStatus("New captures will save without a project.");
  }
});

reportTitleEl.addEventListener("input", () => {
  updateSendUi();
});

sendReportBtn.addEventListener("click", () => {
  void submitCapture();
});

actionScreenshot.addEventListener("click", async () => {
  setStatus("Capturing screenshot…");
  actionScreenshot.disabled = true;
  const res = await sendToActiveTab({
    ...mountPayload(),
    type: "SPOTTING_SCREENSHOT",
  });
  if (res.ok && res.hasPendingScreenshot) {
    await refreshCaptureState();
    reportTitleEl.focus();
    reportTitleEl.select();
  } else if (res.ok) {
    setStatus("Screenshot cancelled.");
  } else {
    setStatus(res.error ?? "Failed.", true);
  }
  actionScreenshot.disabled = false;
});

actionRecord.addEventListener("click", async () => {
  setStatus("Recording this tab…");
  actionRecord.disabled = true;
  const res = await sendToActiveTab({
    ...mountPayload(),
    type: "SPOTTING_START_RECORD",
  });
  if (res.ok) {
    setRecordingUi(Boolean(res.isRecording));
    if (res.isRecording) {
      setStatus(
        "Recording this tab — look for the red Spotting badge. Stop from the extension when done.",
      );
    } else {
      setStatus("Could not start recording on this tab.", true);
    }
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
    setRecordingUi(Boolean(res.isRecording));
    if (res.hasPendingRecording) {
      await refreshCaptureState();
      reportTitleEl.focus();
      reportTitleEl.select();
    } else {
      setStatus(
        "No recording was saved. Record for a few seconds, then use Stop recording in the extension.",
        true,
      );
    }
  } else {
    setStatus(res.error ?? "Failed.", true);
  }
  actionStopRecord.disabled = false;
});

void load();
