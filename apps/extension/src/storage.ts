/// <reference types="chrome" />

const API_KEY = "spottingApiBase";
const PUBLIC_KEY = "spottingPublicKey";
const DASHBOARD_KEY = "spottingDashboardUrl";

/** Legacy Crikket extension keys — migrated on read. */
const LEGACY_API_KEYS = [
  "crikketApiBase",
  "crikket_api_base",
  "crikketServerUrl",
] as const;
const LEGACY_PUBLIC_KEYS = [
  "crikketPublicKey",
  "crikket_public_key",
  "crikketKey",
] as const;

export type ExtensionSettings = {
  apiBaseUrl: string;
  publicKey: string;
  dashboardUrl: string;
};

const DEFAULT_API = "http://localhost:3000";
const DEFAULT_DASHBOARD = "http://localhost:3003";

/** Next.js dev server port in this monorepo — not the Hono API. */
const DASHBOARD_DEV_PORT = "3003";
const API_DEV_PORT = "3000";

export type NormalizeApiResult = {
  url: string;
  corrected: boolean;
};

/** Rewrite common dashboard URL mistakes to the Hono API base. */
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

function pickString(
  values: Record<string, unknown>,
  keys: readonly string[],
): string {
  for (const key of keys) {
    const value = values[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return "";
}

async function readArea(
  area: chrome.storage.StorageArea,
): Promise<Record<string, unknown>> {
  const keys = [
    API_KEY,
    PUBLIC_KEY,
    DASHBOARD_KEY,
    ...LEGACY_API_KEYS,
    ...LEGACY_PUBLIC_KEYS,
  ];
  return area.get(keys);
}

export async function loadExtensionSettings(): Promise<ExtensionSettings> {
  const [syncValues, localValues] = await Promise.all([
    readArea(chrome.storage.sync),
    readArea(chrome.storage.local),
  ]);

  const merged = { ...localValues, ...syncValues };
  const rawApi =
    pickString(merged, [API_KEY, ...LEGACY_API_KEYS]) || DEFAULT_API;
  const { url: apiBaseUrl, corrected } = normalizeApiBaseUrl(rawApi);
  const publicKey = pickString(merged, [PUBLIC_KEY, ...LEGACY_PUBLIC_KEYS]);
  const dashboardUrl =
    pickString(merged, [DASHBOARD_KEY]) || DEFAULT_DASHBOARD;

  if (corrected && apiBaseUrl !== rawApi) {
    await saveExtensionSettings({ apiBaseUrl, publicKey, dashboardUrl }).catch(
      () => undefined,
    );
  }

  return { apiBaseUrl, publicKey, dashboardUrl };
}

export function isExtensionConfigured(settings: ExtensionSettings): boolean {
  return (
    settings.publicKey.startsWith("crk_") &&
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
  if (!key.startsWith("crk_")) {
    return "Public key must start with crk_";
  }
  return null;
}
