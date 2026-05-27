/**
 * Runs in the page MAIN world (injected script). Patches fetch/XHR/console
 * and emits events the content-script bridge listens for.
 */
(() => {
  const FLAG = "__SPOTTING_PAGE_CAPTURE_V1__";
  const win = window as unknown as Record<string, unknown>;
  if (win[FLAG]) return;
  win[FLAG] = true;

  const EVENT_NAME = "spotting:capture:v1";
  const MESSAGE_SOURCE = "spotting-capture-v1";
  const MAX_BODY_CHARS = 64 * 1024;
  let seq = 0;

  function nextId(prefix: string): string {
    seq += 1;
    return `${prefix}-${seq}-${Date.now()}`;
  }

  function emit(type: string, payload: unknown) {
    const message = { source: MESSAGE_SOURCE, type, payload };
    window.postMessage(message, "*");
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, { detail: { type, payload } }),
    );
    if (window.parent !== window) {
      try {
        window.top?.postMessage(message, "*");
      } catch {
        /* cross-origin frame boundary */
      }
    }
  }

  function headersToRecord(h: Headers): Record<string, string> {
    const o: Record<string, string> = {};
    h.forEach((v, k) => {
      o[k] = v;
    });
    return o;
  }

  function truncateBody(text: string): string {
    if (text.length <= MAX_BODY_CHARS) return text;
    return `${text.slice(0, MAX_BODY_CHARS)}\n…[truncated]`;
  }

  function serializeRequestBody(body: BodyInit | null | undefined): string | undefined {
    if (body == null) return undefined;
    if (typeof body === "string") return truncateBody(body);
    if (body instanceof URLSearchParams) return truncateBody(body.toString());
    if (body instanceof Blob) {
      return `[blob ${body.type || "application/octet-stream"}, ${body.size} bytes]`;
    }
    if (body instanceof FormData) {
      const parts: string[] = [];
      body.forEach((value, key) => {
        parts.push(`${key}=${typeof value === "string" ? value : "[file]"}`);
      });
      return truncateBody(parts.join("&"));
    }
    try {
      return truncateBody(JSON.stringify(body));
    } catch {
      return "[unserializable body]";
    }
  }

  function serializeXhrBody(
    body: Document | XMLHttpRequestBodyInit | null | undefined,
  ): string | undefined {
    if (body instanceof Document) return "[document]";
    return serializeRequestBody(body ?? undefined);
  }

  async function readResponseBody(res: Response): Promise<string | undefined> {
    try {
      const ct = res.headers.get("content-type") ?? "";
      if (
        ct.includes("octet-stream") ||
        ct.startsWith("image/") ||
        ct.startsWith("video/") ||
        ct.startsWith("audio/")
      ) {
        return `[binary body omitted, ${ct}]`;
      }
      const clone = res.clone();
      const text = await clone.text();
      return truncateBody(text);
    } catch {
      return undefined;
    }
  }

  const originals = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    info: console.info.bind(console),
    debug: console.debug.bind(console),
  };

  function serializeArgs(args: unknown[]): string[] {
    return args.map((a) => {
      try {
        if (typeof a === "string") return a;
        return JSON.stringify(a, (_k, v) =>
          typeof v === "bigint" ? v.toString() : v,
        );
      } catch {
        return String(a);
      }
    });
  }

  function pushConsole(level: string, args: unknown[]) {
    emit("console", {
      id: nextId("c"),
      t: Date.now(),
      level,
      args: serializeArgs(args),
    });
  }

  const consoleLevels = ["log", "info", "warn", "error", "debug"] as const;
  for (const level of consoleLevels) {
    const original = originals[level];
    console[level] = (...args: unknown[]) => {
      pushConsole(level, args);
      return original(...args);
    };
    try {
      const proto = Object.getPrototypeOf(console) as Record<string, unknown>;
      const protoFn = proto[level];
      if (typeof protoFn === "function") {
        proto[level] = function (this: unknown, ...args: unknown[]) {
          pushConsole(level, args);
          return (protoFn as (...args: unknown[]) => unknown).apply(this, args);
        };
      }
    } catch {
      /* ignore */
    }
  }

  window.addEventListener("error", (event) => {
    pushConsole("error", [
      event.message,
      event.filename,
      event.lineno,
      event.colno,
    ]);
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    pushConsole("error", [
      "Unhandled promise rejection",
      reason instanceof Error ? reason.message : String(reason),
    ]);
  });

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
    let requestBody = serializeRequestBody(init?.body);
    if (!requestBody) {
      try {
        const text = await req.clone().text();
        if (text) requestBody = truncateBody(text);
      } catch {
        /* ignore */
      }
    }

    let status: number | undefined;
    let error: string | undefined;
    let responseHeaders: Record<string, string> | undefined;
    let responseBody: string | undefined;

    try {
      const res = await origFetch(input, init);
      status = res.status;
      responseHeaders = headersToRecord(res.headers);
      responseBody = await readResponseBody(res);
      emit("network", {
        id: nextId("n"),
        t: Date.now(),
        type: "fetch",
        method: req.method,
        url: req.url,
        status,
        durationMs: Math.round(performance.now() - t0),
        requestHeaders,
        responseHeaders,
        requestBody,
        responseBody,
      });
      return res;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      emit("network", {
        id: nextId("n"),
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

  XHR.send = function (
    this: XMLHttpRequest,
    body?: Document | XMLHttpRequestBodyInit | null,
  ) {
    const t0 = performance.now();
    const xhr = this as XMLHttpRequest & {
      __spotting_method?: string;
      __spotting_url?: string;
      __spotting_body?: string;
      __spotting_req_headers?: Record<string, string>;
    };
    const method = xhr.__spotting_method ?? "GET";
    const url = xhr.__spotting_url ?? "";
    xhr.__spotting_body = serializeXhrBody(body);

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
          responseBody = truncateBody(xhr.responseText ?? "");
        } else {
          responseBody = `[binary body omitted, ${ct}]`;
        }
      } catch {
        responseBody = undefined;
      }
      emit("network", {
        id: nextId("n"),
        t: Date.now(),
        type: "xhr",
        method,
        url,
        status: xhr.status,
        durationMs: Math.round(performance.now() - t0),
        requestHeaders: xhr.__spotting_req_headers,
        responseHeaders,
        requestBody: xhr.__spotting_body,
        responseBody,
      });
    };

    const onErr = () => {
      emit("network", {
        id: nextId("n"),
        t: Date.now(),
        type: "xhr",
        method,
        url,
        durationMs: Math.round(performance.now() - t0),
        error: "request failed",
        requestHeaders: xhr.__spotting_req_headers,
        requestBody: xhr.__spotting_body,
      });
    };

    xhr.addEventListener("loadend", done, { once: true });
    xhr.addEventListener("error", onErr, { once: true });
    xhr.addEventListener("abort", onErr, { once: true });

    return origSend.call(this, body);
  };

  emit("ready", { t: Date.now() });
})();
