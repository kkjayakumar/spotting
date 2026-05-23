import type { NetworkLogEntry } from "../types";

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
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const method =
      init?.method ??
      (input instanceof Request ? input.method : undefined) ??
      "GET";
    const requestHeaders: Record<string, string> = {};
    if (init?.headers) {
      new Headers(init.headers).forEach((v, k) => {
        requestHeaders[k] = v;
      });
    } else if (input instanceof Request) {
      input.headers.forEach((v, k) => {
        requestHeaders[k] = v;
      });
    }
    let status: number | undefined;
    let error: string | undefined;
    try {
      const res = await origFetch(input, init);
      status = res.status;
      push({
        id: nextId(),
        t: Date.now(),
        type: "fetch",
        method,
        url,
        status,
        durationMs: Math.round(performance.now() - t0),
        requestHeaders,
        responseHeaders: headersToRecord(res.headers),
      });
      return res;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      push({
        id: nextId(),
        t: Date.now(),
        type: "fetch",
        method,
        url,
        durationMs: Math.round(performance.now() - t0),
        error,
        requestHeaders,
      });
      throw e;
    }
  };

  const XHR = XMLHttpRequest.prototype;
  const origOpen = XHR.open;
  const origSend = XHR.send;

  XHR.open = function (
    this: XMLHttpRequest,
    method: string,
    url: string | URL,
    asyncArg: boolean = true,
    username?: string | null,
    password?: string | null,
  ) {
    (this as XMLHttpRequest & { __spotting_method?: string; __spotting_url?: string }).__spotting_method =
      method;
    (this as XMLHttpRequest & { __spotting_url?: string }).__spotting_url =
      typeof url === "string" ? url : url.href;
    return origOpen.call(
      this,
      method,
      url,
      asyncArg !== false,
      username ?? undefined,
      password ?? undefined,
    );
  };

  XHR.send = function (this: XMLHttpRequest, body?: Document | XMLHttpRequestBodyInit | null) {
    const t0 = performance.now();
    const xhr = this as XMLHttpRequest & {
      __spotting_method?: string;
      __spotting_url?: string;
    };
    const method = xhr.__spotting_method ?? "GET";
    const url = xhr.__spotting_url ?? "";

    const done = () => {
      push({
        id: nextId(),
        t: Date.now(),
        type: "xhr",
        method,
        url,
        status: xhr.status,
        durationMs: Math.round(performance.now() - t0),
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
      });
    };

    xhr.addEventListener("loadend", done, { once: true });
    xhr.addEventListener("error", onErr, { once: true });
    xhr.addEventListener("abort", onErr, { once: true });

    return origSend.call(this, body);
  };
}
