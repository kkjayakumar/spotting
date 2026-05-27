import type { UploadSession } from "./prisma-exports";
import { parseCaptureMetadata } from "./report-capture-metadata";
import { createPresignedDownloadUrl } from "./s3";

export type UploadSessionLike = Pick<
  UploadSession,
  "id" | "uploadKey" | "contentType" | "finalizedAt" | "createdAt"
>;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function hasCaptureDebuggerData(metadataJson: unknown): boolean {
  const meta = asRecord(metadataJson) ?? {};
  const { network, console: logs } = parseCaptureMetadata(metadataJson);
  const actions = Array.isArray(meta.actions) ? meta.actions : [];
  return network.length > 0 || logs.length > 0 || actions.length > 0;
}

export function attachmentTypeFromContentType(
  contentType: string,
): "video" | "screenshot" | undefined {
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("image/")) return "screenshot";
  return undefined;
}

export async function resolvePrimaryArtifact(sessions: UploadSessionLike[]) {
  const finalized = sessions
    .filter((s) => s.finalizedAt)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  if (finalized.length === 0) return null;

  const video = finalized.find((s) => s.contentType.startsWith("video/"));
  const image = finalized.find((s) => s.contentType.startsWith("image/"));
  const chosen = video ?? image ?? finalized[0];
  const attachmentType = attachmentTypeFromContentType(chosen.contentType);
  if (!attachmentType) return null;

  const attachmentUrl = await createPresignedDownloadUrl(
    chosen.uploadKey,
    chosen.contentType,
  );
  const thumbnail =
    attachmentType === "screenshot" ? attachmentUrl : undefined;

  return { attachmentType, attachmentUrl, thumbnail };
}

export async function serializeReportForApi<
  T extends {
    pageUrl?: string | null;
    metadataJson?: unknown;
    uploadSessions?: UploadSessionLike[];
    group?: { id: string; name: string } | null;
    groupId?: string | null;
  },
>(report: T, options?: { canEdit?: boolean }) {
  const meta = asRecord(report.metadataJson) ?? {};
  const artifact = report.uploadSessions
    ? await resolvePrimaryArtifact(report.uploadSessions)
    : null;

  const { uploadSessions: _sessions, group, ...rest } = report as T & {
    uploadSessions?: UploadSessionLike[];
    group?: { id: string; name: string } | null;
  };

  return {
    ...rest,
    groupId: report.groupId ?? group?.id ?? null,
    group: group ? { id: group.id, name: group.name } : null,
    url: report.pageUrl ?? undefined,
    tags: Array.isArray(meta.tags)
      ? meta.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
    canEdit: options?.canEdit ?? false,
    attachmentUrl:
      artifact?.attachmentUrl ??
      (typeof meta.attachmentUrl === "string" ? meta.attachmentUrl : undefined),
    attachmentType:
      artifact?.attachmentType ??
      (typeof meta.attachmentType === "string" ? meta.attachmentType : undefined),
    thumbnail:
      artifact?.thumbnail ??
      (typeof meta.thumbnail === "string" ? meta.thumbnail : undefined),
    submissionStatus:
      artifact?.attachmentUrl || typeof meta.attachmentUrl === "string"
        ? "ready"
        : typeof meta.submissionStatus === "string"
          ? meta.submissionStatus
          : "ready",
    debuggerIngestionStatus:
      typeof meta.debuggerIngestionStatus === "string"
        ? meta.debuggerIngestionStatus
        : hasCaptureDebuggerData(report.metadataJson)
          ? "completed"
          : "not_uploaded",
  };
}

export async function serializeReportsForApi<
  T extends {
    pageUrl?: string | null;
    metadataJson?: unknown;
    uploadSessions?: UploadSessionLike[];
  },
>(reports: T[], options?: { canEdit?: boolean }) {
  return Promise.all(
    reports.map((report) => serializeReportForApi(report, options)),
  );
}
