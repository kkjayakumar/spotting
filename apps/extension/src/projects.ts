/// <reference types="chrome" />

import { sendApiFetch } from "./api-proxy";
import { storageGet, storageSet } from "./browser-api";

export type ExtensionProject = {
  id: string;
  name: string;
  sortOrder: number;
  reportCount: number;
};

const PROJECT_STORAGE_KEY = "spotting_report_group_id";

export async function loadSelectedProjectId(): Promise<string | null> {
  const result = await storageGet("local", PROJECT_STORAGE_KEY);
  const projectId = result[PROJECT_STORAGE_KEY];
  return typeof projectId === "string" && projectId.length > 0 ? projectId : null;
}

export async function saveSelectedProjectId(projectId: string | null): Promise<void> {
  await storageSet("local", { [PROJECT_STORAGE_KEY]: projectId });
}

export async function fetchExtensionProjects(input: {
  apiBaseUrl: string;
  publicKey: string;
}): Promise<ExtensionProject[]> {
  const base = input.apiBaseUrl.replace(/\/+$/, "");
  const result = await sendApiFetch({
    url: `${base}/v1/capture/report-groups`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${input.publicKey.trim()}`,
    },
  });

  if (!result.ok) {
    throw new Error(result.error);
  }
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Failed to load projects (${result.status})`);
  }

  const bodyBase64 = result.bodyBase64;
  if (!bodyBase64) {
    throw new Error("Empty response when loading projects");
  }

  const text = new TextDecoder().decode(
    Uint8Array.from(atob(bodyBase64), (char) => char.charCodeAt(0)),
  );
  const parsed = JSON.parse(text) as { groups?: ExtensionProject[] };
  return Array.isArray(parsed.groups) ? parsed.groups : [];
}
