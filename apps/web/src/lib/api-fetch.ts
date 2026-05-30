import { API_BASE_URL } from "@/lib/api-base-url";

type IncomingRequestHeaders = Pick<Headers, "get">;

function resolveBrowserAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const fromStorage = localStorage.getItem("spotting_token");
    if (fromStorage) {
      return fromStorage;
    }
  } catch {
    /* ignore */
  }
  const match = document.cookie.match(/(?:^|;\s*)spotting_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function readTokenFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)spotting_token=([^;]+)/);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

/** Build Authorization headers for browser requests (localStorage / document.cookie). */
export async function buildAuthHeaders(
  init?: HeadersInit,
  incoming?: IncomingRequestHeaders,
): Promise<Headers> {
  const headers = new Headers(init);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (headers.has("Authorization")) {
    return headers;
  }

  let token = resolveBrowserAuthToken();
  if (!token) {
    token = readTokenFromCookieHeader(
      incoming?.get("cookie") ?? headers.get("cookie"),
    );
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

/** RSC / server: pass `headers()` from `next/headers` so the session cookie is forwarded. */
export async function fetchApiWithRequestHeaders(
  path: string,
  options: Omit<RequestInit, "headers"> & {
    headers?: IncomingRequestHeaders;
  } = {},
) {
  const headers = await buildAuthHeaders(undefined, options.headers);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method,
    body: options.body,
    headers,
    cache: "no-store",
  });
  if (!response.ok) {
    let message = "Request failed";
    try {
      const data = await response.json();
      message = data.error?.message || data.message || message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function fetchApi(path: string, options: RequestInit = {}) {
  const headers = await buildAuthHeaders(options.headers);
  const token = headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? null;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method,
    body: options.body,
    headers,
    credentials: token ? "omit" : "include",
    ...(typeof window === "undefined" ? { cache: "no-store" as const } : {}),
  });

  if (!response.ok) {
    let message = "Request failed";
    try {
      const data = await response.json();
      message = data.error?.message || data.message || message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
