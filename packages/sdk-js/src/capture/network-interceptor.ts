import type { NetworkLogEntry } from "../types";
import {
  readNetworkResponseBody,
  serializeNetworkRequestBody,
} from "./network-body";

let installed = false;
let buffer: NetworkLogEntry[] = [];
let maxEvents = 200;
let seq = 0;

function nextId(): string {
  seq += 1;
  return `n-${seq}-${Date.now()}`;
}

function push(entry: NetworkLogEntry) {
  buffer.push(entry);
  if (buffer.length > maxEvents) {
    buffer = buffer.slice(buffer.length - maxEvents);
  }
}

/** Merge an entry from the page-world injected script. */
export function pushNetworkEntry(entry: NetworkLogEntry) {
  if (!entry?.id || !entry.url) return;
  push({
    id: entry.id,
    t: entry.t,
    type: entry.type === "xhr" ? "xhr" : "fetch",
    method: entry.method,
    url: entry.url,
    status: entry.status,
    durationMs: entry.durationMs,
    error: entry.error,
    requestHeaders: entry.requestHeaders,
    responseHeaders: entry.responseHeaders,
    requestBody: entry.requestBody,
    responseBody: entry.responseBody,
  });
}

function headersToRecord(h: Headers): Record<string, string> {
  const o: Record<string, string> = {};
  h.forEach((v, k) => {
    o[k] = v;
  });
  return o;
}

export function setNetworkBufferLimits(max: number) {
  maxEvents = Math.max(20, max);
}

export function getNetworkLog(): NetworkLogEntry[] {
  return buffer.slice();
}

export function clearNetworkLog() {
  buffer = [];
}

export function installNetworkInterceptor() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const origFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const t0 = performance.now();
    let req: Request;
    try {
      req =
        input instanceof Request ? new Request(input, init) : new Request(input, init);
    } catch {
      return origFetch(input, init);
    }

    const requestHeaders: Record<string, string> = {};
    req.headers.forEach((v, k) => {
      requestHeaders[k] = v;
    });
    let requestBody = serializeNetworkRequestBody(init?.body);
    if (!requestBody) {
      try {
        const text = await req.clone().text();
        if (text) requestBody = text;
      } catch {
        /* ignore */
      }
    }

    let status: number | undefined;
    let error: string | undefined;
    try {
      const res = await origFetch(input, init);
      status = res.status;
      const responseBody = await readNetworkResponseBody(res);
      push({
        id: nextId(),
        t: Date.now(),
        type: "fetch",
        method: req.method,
        url: req.url,
        status,
        durationMs: Math.round(performance.now() - t0),
        requestHeaders,
        responseHeaders: headersToRecord(res.headers),
        requestBody,
        responseBody,
      });
      return res;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      push({
        id: nextId(),
        t: Date.now(),
        type: "fetch",
        method: req.method,
        url: req.url,
        durationMs: Math.round(performance.now() - t0),
        error,
        requestHeaders,
        requestBody,
      });
      throw e;
    }
  };

  const XHR = XMLHttpRequest.prototype;
  const origOpen = XHR.open;
  const origSend = XHR.send;
  const origSetRequestHeader = XHR.setRequestHeader;

  XHR.open = function (
    this: XMLHttpRequest,
    method: string,
    url: string | URL,
    asyncArg: boolean = true,
    username?: string | null,
    password?: string | null,
  ) {
    const xhr = this as XMLHttpRequest & {
      __spotting_method?: string;
      __spotting_url?: string;
      __spotting_req_headers?: Record<string, string>;
    };
    xhr.__spotting_method = method;
    xhr.__spotting_url = typeof url === "string" ? url : url.href;
    xhr.__spotting_req_headers = {};
    return origOpen.call(
      this,
      method,
      url,
      asyncArg !== false,
      username ?? undefined,
      password ?? undefined,
    );
  };

  XHR.setRequestHeader = function (
    this: XMLHttpRequest,
    name: string,
    value: string,
  ) {
    const xhr = this as XMLHttpRequest & {
      __spotting_req_headers?: Record<string, string>;
    };
    if (!xhr.__spotting_req_headers) {
      xhr.__spotting_req_headers = {};
    }
    xhr.__spotting_req_headers[name] = value;
    return origSetRequestHeader.call(this, name, value);
  };

  XHR.send = function (this: XMLHttpRequest, body?: Document | XMLHttpRequestBodyInit | null) {
    const t0 = performance.now();
    const xhr = this as XMLHttpRequest & {
      __spotting_method?: string;
      __spotting_url?: string;
      __spotting_body?: string;
      __spotting_req_headers?: Record<string, string>;
    };
    const method = xhr.__spotting_method ?? "GET";
    const url = xhr.__spotting_url ?? "";
    const requestBody =
      body instanceof Document
        ? "[document]"
        : serializeNetworkRequestBody(body ?? undefined);

    const done = () => {
      const responseHeaders: Record<string, string> = {};
      const raw = xhr.getAllResponseHeaders();
      for (const line of raw.split(/\r?\n/)) {
        const idx = line.indexOf(":");
        if (idx > 0) {
          responseHeaders[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
        }
      }
      let responseBody: string | undefined;
      try {
        const ct = xhr.getResponseHeader("content-type") ?? "";
        if (
          !ct.includes("octet-stream") &&
          !ct.startsWith("image/") &&
          !ct.startsWith("video/")
        ) {
          responseBody = xhr.responseText ?? "";
        } else {
          responseBody = `[binary body omitted, ${ct}]`;
        }
      } catch {
        responseBody = undefined;
      }
      push({
        id: nextId(),
        t: Date.now(),
        type: "xhr",
        method,
        url,
        status: xhr.status,
        durationMs: Math.round(performance.now() - t0),
        requestHeaders: xhr.__spotting_req_headers,
        responseHeaders,
        requestBody,
        responseBody,
      });
    };

    const onErr = () => {
      push({
        id: nextId(),
        t: Date.now(),
        type: "xhr",
        method,
        url,
        durationMs: Math.round(performance.now() - t0),
        error: "request failed",
        requestHeaders: xhr.__spotting_req_headers,
        requestBody,
      });
    };

    xhr.addEventListener("loadend", done, { once: true });
    xhr.addEventListener("error", onErr, { once: true });
    xhr.addEventListener("abort", onErr, { once: true });

    return origSend.call(this, body);
  };
}
