import type { Context } from "hono";
import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  captureBearerPattern,
  isLegacyCapturePublicKey,
  legacyCaptureKeysAllowedFromEnv,
} from "./capture-keys";
import type { CapturePublicKey } from "./prisma-exports";
import { ReportVisibility } from "./prisma-exports";
import { prisma } from "./db";
import { attachmentTypeFromContentType } from "./report-artifacts";
import { resolveReportGroupIdForCreate, serializeReportGroup } from "./report-groups";
import { createPresignedUploadUrl, putObjectBuffer } from "./s3";
import {
  apiError,
  optionalTrimmedString,
  readJsonBody,
  requireNonEmptyString,
} from "./validation";

function parseAllowedOrigins(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === "string");
}

function normalizeOrigin(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

function collectRequestOrigins(
  originHeader: string | undefined,
  refererHeader: string | undefined,
  pageUrl?: string | undefined,
  pageUrlHeader?: string | undefined,
): Set<string> {
  const out = new Set<string>();
  for (const raw of [originHeader, refererHeader, pageUrl, pageUrlHeader]) {
    const origin = raw ? normalizeOrigin(raw) : null;
    if (origin) out.add(origin);
  }
  return out;
}

function isLoopbackOrigin(origin: string): boolean {
  try {
    const host = new URL(origin).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  } catch {
    return false;
  }
}

function allowLocalhostPortMismatch(
  allowed: Set<string>,
  requestOrigins: Set<string>,
): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  const allowedLoopback = [...allowed].some(isLoopbackOrigin);
  const requestLoopback = [...requestOrigins].every(isLoopbackOrigin);
  return allowedLoopback && requestLoopback && requestOrigins.size > 0;
}

function originAllowed(
  allowedOrigins: unknown,
  originHeader: string | undefined,
  refererHeader: string | undefined,
  pageUrl?: string | undefined,
  pageUrlHeader?: string | undefined,
): boolean {
  const list = parseAllowedOrigins(allowedOrigins);
  if (list.length === 0 || list.includes("*")) {
    return true;
  }

  const requestOrigins = collectRequestOrigins(
    originHeader,
    refererHeader,
    pageUrl,
    pageUrlHeader,
  );
  if (requestOrigins.size === 0) {
    return false;
  }

  const allowed = new Set<string>();
  for (const entry of list) {
    const trimmed = entry.trim();
    if (trimmed === "*") return true;
    const normalized = normalizeOrigin(trimmed);
    if (normalized) allowed.add(normalized);
  }

  for (const origin of requestOrigins) {
    if (allowed.has(origin)) return true;
  }

  // Local dev: allow any localhost port if any localhost origin is on the key.
  if (allowLocalhostPortMismatch(allowed, requestOrigins)) {
    return true;
  }

  return false;
}

function formatOriginMismatchMessage(
  allowedOrigins: unknown,
  originHeader: string | undefined,
  refererHeader: string | undefined,
  pageUrl?: string | undefined,
): string {
  const requestOrigins = [...collectRequestOrigins(originHeader, refererHeader, pageUrl)];
  const allowed = parseAllowedOrigins(allowedOrigins);
  const requestLabel =
    requestOrigins.length > 0 ? requestOrigins.join(", ") : "unknown";
  const allowedLabel =
    allowed.length > 0 ? allowed.join(", ") : "(none configured)";
  const apiPortHint =
    allowed.some((entry) => entry.includes(":3000")) &&
    requestOrigins.some((entry) => entry.includes(":3003"))
      ? " You listed the API (port 3000); add the dashboard/page URL (e.g. http://localhost:3003) where the widget runs."
      : "";
  return `Origin is not allowed for this capture key. Page origin: ${requestLabel}. Allowed: ${allowedLabel}. Add the website origin (where the widget is embedded) under Dashboard → Settings → Public Keys.${apiPortHint}`;
}

export async function authenticateCapturePublicKey(
  c: Context,
): Promise<CapturePublicKey> {
  const auth = c.req.header("authorization") ?? "";
  const allowLegacy = legacyCaptureKeysAllowedFromEnv();
  const m = auth.match(captureBearerPattern({ allowLegacy }));
  if (!m) {
    throw apiError(401, "UNAUTHORIZED", "Missing or invalid capture public key");
  }
  const token = m[1];
  if (!allowLegacy && isLegacyCapturePublicKey(token)) {
    throw apiError(
      401,
      "UNAUTHORIZED",
      "Legacy crk_ capture keys are no longer accepted. Migrate to spk_ keys.",
    );
  }
  const key = await prisma.capturePublicKey.findFirst({
    where: { token, revokedAt: null },
  });
  if (!key) {
    throw apiError(401, "UNAUTHORIZED", "Unknown or revoked capture key");
  }
  return key;
}

export function assertCaptureOriginAllowed(
  key: CapturePublicKey,
  c: Context,
  pageUrl?: string | undefined,
): void {
  const origin = c.req.header("origin");
  const referer = c.req.header("referer");
  const pageUrlHeader = c.req.header("x-spotting-page-url");
  if (
    !originAllowed(
      key.allowedOrigins,
      origin,
      referer,
      pageUrl,
      pageUrlHeader,
    )
  ) {
    throw apiError(
      403,
      "FORBIDDEN",
      formatOriginMismatchMessage(
        key.allowedOrigins,
        origin,
        referer,
        pageUrl ?? pageUrlHeader,
      ),
    );
  }
}

export async function requireCapturePublicKey(c: Context): Promise<CapturePublicKey> {
  const key = await authenticateCapturePublicKey(c);
  assertCaptureOriginAllowed(key, c);
  return key;
}

export function createCapturePublicRouter() {
  const r = new Hono();
  r.use(
    "*",
    cors({
      origin: "*",
      allowMethods: ["GET", "POST", "PUT", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization", "X-Spotting-Page-Url"],
      maxAge: 86_400,
    }),
  );

  r.get("/report-groups", async (c) => {
    const key = await requireCapturePublicKey(c);
    const groups = await prisma.reportGroup.findMany({
      where: { organizationId: key.organizationId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { reports: true } } },
    });
    return c.json({
      groups: groups.map((group) => serializeReportGroup(group)),
    });
  });

  r.post("/reports", async (c) => {
    const key = await authenticateCapturePublicKey(c);
    const body = await readJsonBody<{
      title?: string;
      description?: string;
      pageUrl?: string;
      metadataJson?: unknown;
      groupId?: string | null;
    }>(c);
    const title = requireNonEmptyString(body.title, "title");
    const description = optionalTrimmedString(body.description);
    const pageUrl = optionalTrimmedString(body.pageUrl);
    assertCaptureOriginAllowed(key, c, pageUrl ?? undefined);
    const groupId = await resolveReportGroupIdForCreate(
      key.organizationId,
      null,
      body.groupId,
    );
    const report = await prisma.report.create({
      data: {
        organizationId: key.organizationId,
        reporterUserId: null,
        title,
        description: description ?? undefined,
        pageUrl: pageUrl ?? undefined,
        metadataJson:
          body.metadataJson === undefined
            ? undefined
            : (body.metadataJson as object),
        visibility: ReportVisibility.private,
        ...(groupId !== undefined && groupId !== null ? { groupId } : {}),
      },
    });
    return c.json(report, 201);
  });

  r.post("/upload-sessions", async (c) => {
    const key = await authenticateCapturePublicKey(c);
    const body = await readJsonBody<{
      reportId?: string;
      contentType?: string;
      fileName?: string;
      pageUrl?: string;
    }>(c);
    const reportId = requireNonEmptyString(body.reportId, "reportId");
    const contentType = requireNonEmptyString(body.contentType, "contentType");
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw apiError(404, "NOT_FOUND", "Report not found");
    if (report.organizationId !== key.organizationId) {
      throw apiError(403, "FORBIDDEN", "Report does not belong to this capture key");
    }
    const pageUrl =
      optionalTrimmedString(body.pageUrl) ??
      optionalTrimmedString(report.pageUrl ?? undefined);
    assertCaptureOriginAllowed(key, c, pageUrl ?? undefined);
    const uploadSession = await prisma.uploadSession.create({
      data: {
        reportId,
        uploadKey: `${report.organizationId}/${report.id}/${crypto.randomUUID()}-${body.fileName ?? "artifact"}`,
        contentType,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
    const { uploadUrl } = await createPresignedUploadUrl(
      uploadSession.uploadKey,
      contentType,
      900,
    );
    return c.json({
      sessionId: uploadSession.id,
      uploadUrl,
      uploadKey: uploadSession.uploadKey,
      expiresAt: uploadSession.expiresAt.toISOString(),
    });
  });

  r.put("/upload-sessions/:sessionId/upload", async (c) => {
    const key = await authenticateCapturePublicKey(c);
    const sessionId = c.req.param("sessionId");
    const uploadSession = await prisma.uploadSession.findUnique({
      where: { id: sessionId },
      include: { report: true },
    });
    if (!uploadSession) throw apiError(404, "NOT_FOUND", "Upload session not found");
    if (uploadSession.report.organizationId !== key.organizationId) {
      throw apiError(403, "FORBIDDEN", "Invalid upload session");
    }
    assertCaptureOriginAllowed(
      key,
      c,
      uploadSession.report.pageUrl ?? undefined,
    );
    if (uploadSession.finalizedAt) {
      throw apiError(409, "CONFLICT", "Upload session already finalized");
    }
    if (uploadSession.expiresAt.getTime() <= Date.now()) {
      throw apiError(410, "GONE", "Upload session has expired");
    }

    const bytes = new Uint8Array(await c.req.arrayBuffer());
    if (bytes.byteLength === 0) {
      throw apiError(400, "VALIDATION_ERROR", "Artifact body is empty");
    }

    await putObjectBuffer(
      uploadSession.uploadKey,
      uploadSession.contentType,
      bytes,
    );
    return c.json({ ok: true, sessionId, bytes: bytes.byteLength });
  });

  r.post("/upload-sessions/:sessionId/finalize", async (c) => {
    const key = await authenticateCapturePublicKey(c);
    const sessionId = c.req.param("sessionId");
    const uploadSession = await prisma.uploadSession.findUnique({
      where: { id: sessionId },
      include: { report: true },
    });
    if (!uploadSession) throw apiError(404, "NOT_FOUND", "Upload session not found");
    if (uploadSession.report.organizationId !== key.organizationId) {
      throw apiError(403, "FORBIDDEN", "Invalid upload session");
    }
    assertCaptureOriginAllowed(
      key,
      c,
      uploadSession.report.pageUrl ?? undefined,
    );
    if (uploadSession.finalizedAt) {
      throw apiError(409, "CONFLICT", "Upload session already finalized");
    }
    if (uploadSession.expiresAt.getTime() <= Date.now()) {
      throw apiError(410, "GONE", "Upload session has expired");
    }
    await prisma.uploadSession.update({
      where: { id: sessionId },
      data: { finalizedAt: new Date() },
    });

    const attachmentType = attachmentTypeFromContentType(uploadSession.contentType);
    const existingMeta =
      uploadSession.report.metadataJson &&
      typeof uploadSession.report.metadataJson === "object" &&
      !Array.isArray(uploadSession.report.metadataJson)
        ? (uploadSession.report.metadataJson as Record<string, unknown>)
        : {};

    if (attachmentType) {
      await prisma.report.update({
        where: { id: uploadSession.reportId },
        data: {
          metadataJson: {
            ...existingMeta,
            attachmentType,
            submissionStatus: "ready",
            primaryUploadSessionId: sessionId,
          },
        },
      });
    }

    return c.json({ ok: true, sessionId });
  });

  return r;
}
