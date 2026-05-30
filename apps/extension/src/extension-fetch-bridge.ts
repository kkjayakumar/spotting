/// <reference types="chrome" />

import { setCaptureFetchTransport } from "@spotting/sdk-js";

import { sendApiFetch } from "./api-proxy";

let installed = false;

/** Extension background fetch bypasses page CORS (widget runs on third-party origins). */
function shouldProxyThroughExtension(_url: string): boolean {
  return true;
}

function headersToRecord(headers: HeadersInit | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!headers) return out;
  new Headers(headers).forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

async function readRequestBody(
  body: BodyInit | null | undefined,
): Promise<string | ArrayBuffer | null | undefined> {
  if (body == null) return undefined;
  if (typeof body === "string") return body;
  if (body instanceof ArrayBuffer) return body;
  if (body instanceof Blob) return body.arrayBuffer();
  if (body instanceof URLSearchParams) return body.toString();
  if (body instanceof FormData) {
    const parts: string[] = [];
    body.forEach((value, key) => {
      parts.push(`${key}=${typeof value === "string" ? value : "[file]"}`);
    });
    return parts.join("&");
  }
  return String(body);
}

export function installExtensionFetchBridge() {
  if (installed) return;
  installed = true;

  setCaptureFetchTransport(async (url: string, init: RequestInit) => {
    if (!shouldProxyThroughExtension(url)) {
      return fetch(url, init);
    }

    const result = await sendApiFetch({
      url,
      method: init.method,
      headers: headersToRecord(init.headers),
      body: await readRequestBody(init.body ?? null),
    });

    if (!result.ok) {
      throw new Error(result.error);
    }

    const bodyBytes = result.bodyBase64
      ? Uint8Array.from(atob(result.bodyBase64), (c) => c.charCodeAt(0))
      : result.body instanceof ArrayBuffer
        ? new Uint8Array(result.body)
        : typeof result.body === "string"
          ? new TextEncoder().encode(result.body)
          : null;

    if (bodyBytes == null) {
      throw new Error(
        "Extension API proxy returned an unreadable response body. Reload the extension in chrome://extensions.",
      );
    }

    return new Response(bodyBytes, {
      status: result.status,
      statusText: result.statusText,
      headers: result.headers,
    });
  });
}
