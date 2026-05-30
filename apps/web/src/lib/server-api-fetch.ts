import "server-only";

import { API_BASE_URL } from "@/lib/api-base-url";
import { readSessionToken } from "@/lib/read-session-token";

/** Build Authorization headers for RSC / route handlers (reads session cookie). */
export async function buildServerAuthHeaders(
  init?: HeadersInit,
): Promise<Headers> {
  const headers = new Headers(init);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!headers.has("Authorization")) {
    const token = await readSessionToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  return headers;
}

export async function fetchServerApi(
  path: string,
  options: RequestInit = {},
) {
  const headers = await buildServerAuthHeaders(options.headers);
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
