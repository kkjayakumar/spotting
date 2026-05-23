/// <reference types="chrome" />

export type ApiFetchMessage = {
  type: "SPOTTING_API_FETCH";
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string | ArrayBuffer | null;
};

export type ApiFetchResult =
  | {
      ok: true;
      status: number;
      statusText: string;
      headers: Record<string, string>;
      body: ArrayBuffer;
    }
  | { ok: false; error: string; status?: number };

function formatFetchFailure(url: string, error: string): string {
  const isLocal =
    url.includes("localhost") || url.includes("127.0.0.1");
  if (error === "Failed to fetch" && isLocal) {
    return (
      "Cannot reach the Spotting API at " +
      url +
      ". Start it with: bun run dev:api (from the spotting repo). " +
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
      body: message.body ?? undefined,
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
      body,
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

  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: "SPOTTING_API_FETCH", ...message } satisfies ApiFetchMessage,
      (response: ApiFetchResult | undefined) => {
        const lastError = chrome.runtime.lastError;
        if (lastError?.message) {
          resolve({
            ok: false,
            error: `Extension could not reach the API proxy: ${lastError.message}. Reload the extension in chrome://extensions.`,
          });
          return;
        }
        if (!response) {
          resolve({
            ok: false,
            error:
              "Extension background did not respond. Reload the extension in chrome://extensions.",
          });
          return;
        }
        resolve(response);
      },
    );
  });
}

async function wakeServiceWorker(): Promise<void> {
  await new Promise<void>((resolve) => {
    chrome.runtime.sendMessage({ type: "SPOTTING_PING_BG" }, () => {
      void chrome.runtime.lastError;
      resolve();
    });
  });
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
