/// <reference types="chrome" />

import {
  capturePublicKeyValidationMessage,
  isCapturePublicKey,
} from "@spotting/shared/constants/capture-keys";

const API_KEY = "spottingApiBase";
const PUBLIC_KEY = "spottingPublicKey";
const DASHBOARD_KEY = "spottingDashboardUrl";

const EXTENSION_KEY_POLICY = { allowLegacy: false } as const;

export type ExtensionSettings = {
  apiBaseUrl: string;
  publicKey: string;
  dashboardUrl: string;
};

const DEFAULT_API = "http://localhost:3000";
const DEFAULT_DASHBOARD = "http://localhost:3001";

const DASHBOARD_DEV_PORT = "3001";
const API_DEV_PORT = "3000";

export type NormalizeApiResult = {
  url: string;
  corrected: boolean;
};

export function normalizeApiBaseUrl(url: string): NormalizeApiResult {
  const trimmed = url.trim();
  if (!trimmed) {
    return { url: DEFAULT_API, corrected: true };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.port === DASHBOARD_DEV_PORT) {
      parsed.port = API_DEV_PORT;
      return { url: parsed.toString().replace(/\/+$/, ""), corrected: true };
    }
    return { url: trimmed.replace(/\/+$/, ""), corrected: false };
  } catch {
    return { url: trimmed, corrected: false };
  }
}

async function readArea(
  area: chrome.storage.StorageArea,
): Promise<Record<string, unknown>> {
  return area.get([API_KEY, PUBLIC_KEY, DASHBOARD_KEY]);
}

export async function loadExtensionSettings(): Promise<ExtensionSettings> {
  const [syncValues, localValues] = await Promise.all([
    readArea(chrome.storage.sync),
    readArea(chrome.storage.local),
  ]);

  const merged = { ...localValues, ...syncValues };
  const rawApi =
    typeof merged[API_KEY] === "string" ? merged[API_KEY].trim() : DEFAULT_API;
  const { url: apiBaseUrl, corrected } = normalizeApiBaseUrl(rawApi);
  const publicKey =
    typeof merged[PUBLIC_KEY] === "string" ? merged[PUBLIC_KEY].trim() : "";
  const dashboardUrl =
    typeof merged[DASHBOARD_KEY] === "string" && merged[DASHBOARD_KEY].trim()
      ? merged[DASHBOARD_KEY].trim()
      : DEFAULT_DASHBOARD;

  if (corrected && apiBaseUrl !== rawApi) {
    await saveExtensionSettings({ apiBaseUrl, publicKey, dashboardUrl }).catch(
      () => undefined,
    );
  }

  return { apiBaseUrl, publicKey, dashboardUrl };
}

export function isExtensionConfigured(settings: ExtensionSettings): boolean {
  return (
    isCapturePublicKey(settings.publicKey, EXTENSION_KEY_POLICY) &&
    validateApiBaseUrl(settings.apiBaseUrl) === null
  );
}

export function dashboardHomeUrl(dashboardUrl: string): string {
  const base = dashboardUrl.trim().replace(/\/+$/, "") || DEFAULT_DASHBOARD;
  return `${base}/dashboard`;
}

export async function saveExtensionSettings(
  settings: ExtensionSettings,
): Promise<void> {
  const payload = {
    [API_KEY]: settings.apiBaseUrl,
    [PUBLIC_KEY]: settings.publicKey,
    [DASHBOARD_KEY]: settings.dashboardUrl || DEFAULT_DASHBOARD,
  };

  await Promise.all([
    chrome.storage.sync.set(payload),
    chrome.storage.local.set(payload),
  ]);
}

export function validateApiBaseUrl(url: string): string | null {
  if (!url.trim()) {
    return "API base URL is required.";
  }

  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "API URL must start with http:// or https://";
    }
  } catch {
    return "Enter a valid API URL (e.g. http://localhost:3000).";
  }

  return null;
}

export function validatePublicKey(key: string): string | null {
  if (!isCapturePublicKey(key.trim(), EXTENSION_KEY_POLICY)) {
    return capturePublicKeyValidationMessage(EXTENSION_KEY_POLICY);
  }
  return null;
}
