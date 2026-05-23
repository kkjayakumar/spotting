import { API_BASE_URL } from "@/lib/api-base-url";

type IncomingRequestHeaders = Pick<Headers, "get">;

/** RSC / server: pass `headers()` from `next/headers` so the session cookie is forwarded. */
export async function fetchApiWithRequestHeaders(
  path: string,
  options: Omit<RequestInit, "headers"> & {
    headers?: IncomingRequestHeaders;
  } = {},
) {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  const cookieHeader = options.headers?.get("cookie") ?? "";
  if (cookieHeader.length > 0) {
    headers.set("Cookie", cookieHeader);
  }
  if (!headers.has("Authorization")) {
    const match = cookieHeader.match(/spotting_token=([^;]+)/);
    if (match) {
      headers.set(
        "Authorization",
        `Bearer ${decodeURIComponent(match[1])}`,
      );
    }
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
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
  const match = document.cookie.match(/spotting_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function fetchApi(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const token = resolveBrowserAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: token ? "omit" : "include",
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
