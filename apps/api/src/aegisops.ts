import crypto from "node:crypto";

const WEBHOOK_URL = process.env.AEGISOPS_WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.AEGISOPS_WEBHOOK_SECRET ?? "";

export type SpottingWebhookPayload = {
  event: "spotting.report.created";
  reportId: string;
  correlationId: string;
  pageUrl?: string;
  severity: "error" | "warning";
  networkFailures: Array<{ method: string; url: string; status: number }>;
  consoleErrors: number;
};

function signBody(body: string): string {
  if (!WEBHOOK_SECRET) return "";
  return crypto.createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");
}

export function extractCorrelationId(metadataJson: unknown): string {
  if (!metadataJson || typeof metadataJson !== "object" || Array.isArray(metadataJson)) {
    return crypto.randomUUID();
  }
  const meta = metadataJson as Record<string, unknown>;
  if (typeof meta.correlationId === "string" && meta.correlationId) return meta.correlationId;
  const network = Array.isArray(meta.network) ? meta.network : [];
  for (let i = network.length - 1; i >= 0; i--) {
    const entry = network[i] as Record<string, unknown>;
    for (const headers of [entry.responseHeaders, entry.requestHeaders]) {
      if (!headers || typeof headers !== "object") continue;
      for (const [k, v] of Object.entries(headers as Record<string, string>)) {
        if (k.toLowerCase() === "x-request-id" && v) return v;
      }
    }
  }
  return crypto.randomUUID();
}

export function assessReportSeverity(metadataJson: unknown) {
  const meta = metadataJson && typeof metadataJson === "object" && !Array.isArray(metadataJson)
    ? (metadataJson as Record<string, unknown>) : {};
  const network = Array.isArray(meta.network) ? meta.network : [];
  const consoleLogs = Array.isArray(meta.console) ? meta.console : [];
  const networkFailures = network.filter((n) => {
    const e = n as Record<string, unknown>;
    return typeof e.status === "number" && e.status >= 400;
  }).map((n) => {
    const e = n as Record<string, unknown>;
    return { method: String(e.method ?? "GET"), url: String(e.url ?? ""), status: Number(e.status ?? 0) };
  });
  const consoleErrors = consoleLogs.filter((c) => (c as Record<string, unknown>).level === "error").length;
  const shouldNotify = networkFailures.length > 0 || consoleErrors > 0;
  const severity = networkFailures.some((n) => n.status >= 500) || consoleErrors > 0 ? "error" as const : "warning" as const;
  return { shouldNotify, severity, networkFailures, consoleErrors };
}

export async function notifyAegisReportCreated(input: {
  reportId: string;
  pageUrl?: string | null;
  metadataJson: unknown;
}): Promise<void> {
  if (!WEBHOOK_URL) return;
  const assessment = assessReportSeverity(input.metadataJson);
  if (!assessment.shouldNotify) return;
  const payload: SpottingWebhookPayload = {
    event: "spotting.report.created",
    reportId: input.reportId,
    correlationId: extractCorrelationId(input.metadataJson),
    pageUrl: input.pageUrl ?? undefined,
    severity: assessment.severity,
    networkFailures: assessment.networkFailures.slice(0, 10),
    consoleErrors: assessment.consoleErrors,
  };
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const signature = signBody(body);
  if (signature) headers["X-Aegis-Signature"] = `sha256=${signature}`;
  try {
    const res = await fetch(WEBHOOK_URL, { method: "POST", headers, body });
    if (!res.ok) console.error("[AegisOps] Spotting webhook failed:", res.status);
  } catch (err) {
    console.error("[AegisOps] Spotting webhook error:", err);
  }
}
