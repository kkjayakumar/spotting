import type { CaptureMetadata, SubmitCaptureInput } from "./types";
import { getConsoleLog } from "./capture/console-interceptor";
import { getNetworkLog } from "./capture/network-interceptor";
import {
  getCaptureSessionDurationMs,
  getCaptureSessionEndedAt,
  getCaptureSessionStartedAt,
} from "./capture/capture-session";
import { fetchViaCaptureTransport } from "./capture/extension-fetch";
import { getUserActionLog } from "./capture/user-actions";

export interface SpottingClientOptions {
  publicKey: string;
  apiBaseUrl: string;
}

function normalizeBase(url: string): string {
  return url.replace(/\/+$/, "");
}

function isLoopbackHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]"
  );
}

/**
 * When the widget runs on the Next.js app (e.g. :3003) and the API is on :3000,
 * use same-origin `/v1` (rewritten by Next) to avoid CORS and "Failed to fetch".
 */
export function resolveCaptureApiBaseUrl(configured: string): string {
  const base = normalizeBase(configured);
  if (typeof window === "undefined") return base;

  try {
    const page = new URL(window.location.href);
    const api = new URL(base);
    const pageIsLoopback = isLoopbackHost(page.hostname);
    const apiIsLoopback = isLoopbackHost(api.hostname);
    const dashboardPorts = new Set(["3003", "3001"]);
    const apiPorts = new Set(["3000", ""]);

    if (
      pageIsLoopback &&
      apiIsLoopback &&
      dashboardPorts.has(page.port) &&
      apiPorts.has(api.port)
    ) {
      return page.origin;
    }
  } catch {
    /* use configured */
  }

  return base;
}

function mixedContentHint(apiBaseUrl: string): string {
  if (typeof window === "undefined" || window.location.protocol !== "https:") {
    return "";
  }
  try {
    const api = new URL(apiBaseUrl);
    if (api.protocol === "http:") {
      return " HTTPS pages cannot call HTTP APIs (browser mixed-content block). Use an HTTPS API URL for staging/production, or reload the Spotting extension (it proxies API calls through the extension).";
    }
  } catch {
    /* ignore */
  }
  return "";
}

function networkError(label: string, apiBaseUrl: string, cause: unknown): Error {
  const detail =
    cause instanceof Error ? cause.message : "Failed to fetch";
  if (
    detail.includes("Cannot reach the Spotting API") ||
    detail.includes("Extension could not") ||
    detail.includes("Extension background")
  ) {
    return new Error(`${label}: ${detail}`);
  }
  return new Error(
    `${label}: ${detail}. Check that the Spotting API is running (${apiBaseUrl}) and your public key allows this page origin (e.g. ${typeof window !== "undefined" ? window.location.origin : "your site"}).${mixedContentHint(apiBaseUrl)}`,
  );
}

async function captureFetch(
  apiBaseUrl: string,
  input: string,
  init: RequestInit,
  label: string,
): Promise<Response> {
  try {
    return await fetchViaCaptureTransport(input, init);
  } catch (e) {
    throw networkError(label, apiBaseUrl, e);
  }
}

function formatApiFailure(res: Response, text: string, label: string): Error {
  const sample = text.trimStart().slice(0, 160);
  const looksLikeHtml =
    sample.startsWith("<!") || sample.toLowerCase().includes("<!doctype");
  if (looksLikeHtml) {
    return new Error(
      `${label} failed (${res.status}): response was HTML, not JSON. Use the Spotting Hono API base URL (e.g. http://localhost:3000), not the Next.js dev server (often :3003).`,
    );
  }
  try {
    const json = JSON.parse(text) as { error?: { message?: string } };
    const apiMessage = json.error?.message?.trim();
    if (apiMessage) {
      return new Error(`${label} failed: ${res.status} ${apiMessage}`);
    }
  } catch {
    /* not JSON */
  }
  const tail = text.length > 400 ? `${text.slice(0, 400)}…` : text;
  return new Error(`${label} failed: ${res.status} ${tail}`);
}

function capturePageUrl(): string | undefined {
  return typeof location !== "undefined" ? location.href : undefined;
}

function captureHeaders(
  publicKey: string,
  extra?: Record<string, string>,
): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${publicKey}`,
    ...extra,
  };
  const pageUrl = capturePageUrl();
  if (pageUrl) {
    headers["X-Spotting-Page-Url"] = pageUrl;
  }
  return headers;
}

export class SpottingClient {
  readonly publicKey: string;
  readonly apiBaseUrl: string;

  constructor(options: SpottingClientOptions) {
    if (!options.publicKey?.startsWith("crk_")) {
      throw new Error("publicKey must look like crk_…");
    }
    this.publicKey = options.publicKey;
    this.apiBaseUrl = resolveCaptureApiBaseUrl(options.apiBaseUrl);
  }

  buildMetadata(extra?: Partial<CaptureMetadata>): CaptureMetadata {
    const sessionStartedAt = getCaptureSessionStartedAt();
    const sessionEndedAt = getCaptureSessionEndedAt();
    const durationMs = getCaptureSessionDurationMs();

    return {
      network: getNetworkLog(),
      console: getConsoleLog(),
      actions: getUserActionLog(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      language: typeof navigator !== "undefined" ? navigator.language : "",
      viewport:
        typeof window !== "undefined"
          ? { w: window.innerWidth, h: window.innerHeight }
          : { w: 0, h: 0 },
      ...(sessionStartedAt != null
        ? { captureSessionStartedAt: sessionStartedAt }
        : {}),
      ...(sessionEndedAt != null ? { captureSessionEndedAt: sessionEndedAt } : {}),
      ...(durationMs != null ? { durationMs } : {}),
      ...extra,
    };
  }

  async createReport(input: {
    title: string;
    description?: string;
    pageUrl?: string;
    metadata: CaptureMetadata;
  }): Promise<{ id: string }> {
    const res = await captureFetch(
      this.apiBaseUrl,
      `${this.apiBaseUrl}/v1/capture/reports`,
      {
        method: "POST",
        headers: captureHeaders(this.publicKey, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          title: input.title,
          description: input.description,
          pageUrl: input.pageUrl,
          metadataJson: input.metadata,
        }),
      },
      "createReport",
    );
    const text = await res.text();
    if (!res.ok) {
      throw formatApiFailure(res, text, "createReport");
    }
    let data: { id?: string };
    try {
      data = JSON.parse(text) as { id?: string };
    } catch {
      throw new Error(
        `createReport failed: API returned non-JSON (${res.status}). ${text.trimStart().slice(0, 160)}`,
      );
    }
    if (!data.id) {
      throw new Error("createReport failed: response missing report id.");
    }
    return { id: data.id };
  }

  async uploadArtifact(
    reportId: string,
    blob: Blob,
    fileName: string,
  ): Promise<void> {
    const contentType = blob.type || "application/octet-stream";
    const pageUrl = capturePageUrl();
    const start = await captureFetch(
      this.apiBaseUrl,
      `${this.apiBaseUrl}/v1/capture/upload-sessions`,
      {
        method: "POST",
        headers: captureHeaders(this.publicKey, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          reportId,
          contentType,
          fileName,
          ...(pageUrl ? { pageUrl } : {}),
        }),
      },
      "upload-sessions",
    );
    const startText = await start.text();
    if (!start.ok) {
      throw formatApiFailure(start, startText, "upload-sessions");
    }
    let sessionId: string;
    try {
      sessionId = (JSON.parse(startText) as { sessionId?: string }).sessionId ?? "";
    } catch {
      throw new Error(
        `upload-sessions failed: API returned non-JSON (${start.status}). ${startText.trimStart().slice(0, 160)}`,
      );
    }
    if (!sessionId) {
      throw new Error("upload-sessions failed: response missing sessionId.");
    }

    const put = await captureFetch(
      this.apiBaseUrl,
      `${this.apiBaseUrl}/v1/capture/upload-sessions/${sessionId}/upload`,
      {
        method: "PUT",
        headers: captureHeaders(this.publicKey, {
          "Content-Type": contentType,
        }),
        body: blob,
      },
      "artifact upload",
    );
    if (!put.ok) {
      const text = await put.text();
      throw formatApiFailure(put, text, "artifact upload");
    }

    const fin = await captureFetch(
      this.apiBaseUrl,
      `${this.apiBaseUrl}/v1/capture/upload-sessions/${sessionId}/finalize`,
      {
        method: "POST",
        headers: captureHeaders(this.publicKey),
      },
      "finalize",
    );
    if (!fin.ok) {
      const text = await fin.text();
      throw formatApiFailure(fin, text, "finalize");
    }
  }

  /** Create report, upload optional blobs, return report id */
  async submitCapture(input: SubmitCaptureInput): Promise<{ reportId: string }> {
    const metadata = this.buildMetadata({
      recordingMimeType: input.recordingBlob?.type,
    });
    const { id: reportId } = await this.createReport({
      title: input.title,
      description: input.description,
      pageUrl: input.pageUrl ?? (typeof location !== "undefined" ? location.href : undefined),
      metadata,
    });

    if (input.screenshotBlob && input.screenshotBlob.size > 0) {
      await this.uploadArtifact(reportId, input.screenshotBlob, "screenshot.png");
    }
    if (input.recordingBlob && input.recordingBlob.size > 0) {
      await this.uploadArtifact(
        reportId,
        input.recordingBlob,
        `recording.${input.recordingBlob.type.includes("webm") ? "webm" : "bin"}`,
      );
    }

    return { reportId };
  }
}
