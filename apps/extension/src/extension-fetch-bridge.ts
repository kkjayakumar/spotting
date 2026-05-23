/// <reference types="chrome" />

import { setCaptureFetchTransport } from "@spotting/sdk-js";

import { sendApiFetch } from "./api-proxy";

let installed = false;

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
    const result = await sendApiFetch({
      url,
      method: init.method,
      headers: headersToRecord(init.headers),
      body: await readRequestBody(init.body ?? null),
    });

    if (!result.ok) {
      throw new Error(result.error);
    }

    return new Response(result.body, {
      status: result.status,
      statusText: result.statusText,
      headers: result.headers,
    });
  });
}
