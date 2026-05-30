import "server-only";

import { fetchServerApi } from "@/lib/server-api-fetch";

import {
  normalizeCaptureKeyList,
  type CaptureKeyListItem,
} from "./capture-keys";

export type { CaptureKeyListItem };

export async function listCaptureKeysServer(
  organizationId: string,
): Promise<CaptureKeyListItem[]> {
  try {
    const data = await fetchServerApi(
      `/v1/orgs/${organizationId}/capture-keys`,
    );
    return normalizeCaptureKeyList(data);
  } catch {
    return [];
  }
}
