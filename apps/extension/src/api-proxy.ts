/// <reference types="chrome" />

import {
  runtimeLastErrorMessage,
  runtimeSendMessage,
  withLastErrorIgnored,
} from "./browser-api";

export type ApiFetchMessage = {
  type: "SPOTTING_API_FETCH";
  url: string;
  method?: string;
  headers?: Record<string, string>;
  /** Legacy path; prefer bodyBase64 for MV3 message passing. */
  body?: string | ArrayBuffer | null;
  bodyBase64?: string | null;
};

export type ApiFetchResult =
  | {
      ok: true;
      status: number;
      statusText: string;
      headers: Record<string, string>;
      /** Legacy path; prefer bodyBase64 for MV3 message passing. */
      body?: ArrayBuffer;
      bodyBase64?: string;
    }
  | { ok: false; error: string; status?: number };

function arrayBufferToBase64(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < view.length; i += chunkSize) {
    binary += String.fromCharCode(...view.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function encodeRequestBody(
  body: string | ArrayBuffer | null | undefined,
): Pick<ApiFetchMessage, "body" | "bodyBase64"> {
  if (body == null) return {};
  if (typeof body === "string") {
    return { body };
  }
  return { bodyBase64: arrayBufferToBase64(body) };
}

function decodeRequestBody(
  message: ApiFetchMessage,
): string | ArrayBuffer | undefined {
  if (message.bodyBase64) {
    return base64ToArrayBuffer(message.bodyBase64);
  }
  if (message.body == null) return undefined;
  return message.body;
}

function formatFetchFailure(url: string, error: string): string {
  const isLocal =
    url.includes("localhost") || url.includes("127.0.0.1");
  if (error === "Failed to fetch" && isLocal) {
    return (
      "Cannot reach the Spotting API at " +
      url +
      ". Start it with: npm run dev:api (from the spotting repo). " +
      "If you use a remote/staging API, set that HTTPS URL in extension settings."
    );
  }
  return error;
}

export async function proxyApiFetch(
  message: ApiFetchMessage,
): Promise<ApiFetchResult> {
  try {
    const res = await fetch(message.url, {
      method: message.method ?? "GET",
      headers: message.headers,
      body: decodeRequestBody(message),
    });
    const body = await res.arrayBuffer();
    const headers: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return {
      ok: true,
      status: res.status,
      statusText: res.statusText,
      headers,
      bodyBase64: arrayBufferToBase64(body),
    };
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Failed to fetch";
    return {
      ok: false,
      error: formatFetchFailure(message.url, raw),
    };
  }
}

export async function sendApiFetch(
  message: Omit<ApiFetchMessage, "type">,
): Promise<ApiFetchResult> {
  await wakeServiceWorker();

  const encodedBody = encodeRequestBody(message.body ?? null);

  try {
    const response = await runtimeSendMessage<
      ApiFetchMessage,
      ApiFetchResult | undefined
    >({
      type: "SPOTTING_API_FETCH",
      url: message.url,
      method: message.method,
      headers: message.headers,
      ...encodedBody,
    } satisfies ApiFetchMessage);
    if (!response) {
      return {
        ok: false,
        error:
          "Extension background did not respond. Reload the extension and try again.",
      };
    }
    return response;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown extension runtime error";
    return {
      ok: false,
      error: `Extension could not reach the API proxy: ${msg}. Reload the extension and try again.`,
    };
  }
}

async function wakeServiceWorker(): Promise<void> {
  try {
    await runtimeSendMessage<{ type: "SPOTTING_PING_BG" }, unknown>({
      type: "SPOTTING_PING_BG",
    });
  } catch {
    withLastErrorIgnored();
    void runtimeLastErrorMessage();
  }
}

export async function testApiHealth(apiBaseUrl: string): Promise<{
  ok: boolean;
  message: string;
}> {
  const base = apiBaseUrl.replace(/\/+$/, "");
  const result = await sendApiFetch({
    url: `${base}/healthz`,
    method: "GET",
  });
  if (!result.ok) {
    return { ok: false, message: result.error };
  }
  if (result.status < 200 || result.status >= 300) {
    return {
      ok: false,
      message: `API returned ${result.status} from ${base}/healthz`,
    };
  }
  return { ok: true, message: `Connected to ${base}` };
}
