import { InvitationStatus, type PrismaClient } from "../../api/src/generated/prisma";
import { deleteReportsStorageArtifacts } from "./report-storage-cleanup";

export type WorkerPrisma = Pick<
  PrismaClient,
  "invitation" | "uploadSession" | "report"
>;

export type MaintenanceResult = {
  cancelledInvites: number;
  expiredUploadSessions: number;
  deletedReports: number;
  nowIso: string;
};

const DEFAULT_REPORT_RETENTION_DAYS = 90;
const REPORT_PURGE_BATCH_SIZE = 100;

export function reportRetentionDays(): number {
  const raw = Number(process.env.REPORT_RETENTION_DAYS ?? DEFAULT_REPORT_RETENTION_DAYS);
  if (!Number.isFinite(raw) || raw < 1) {
    return DEFAULT_REPORT_RETENTION_DAYS;
  }
  return Math.floor(raw);
}

export async function purgeExpiredReports(
  prisma: Pick<PrismaClient, "report" | "uploadSession">,
  now = new Date(),
): Promise<number> {
  const retentionDays = reportRetentionDays();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - retentionDays);

  let deletedReports = 0;

  for (;;) {
    const expired = await prisma.report.findMany({
      where: { createdAt: { lte: cutoff } },
      select: { id: true, organizationId: true },
      take: REPORT_PURGE_BATCH_SIZE,
      orderBy: { createdAt: "asc" },
    });

    if (expired.length === 0) {
      break;
    }

    await deleteReportsStorageArtifacts(prisma, expired);
    const result = await prisma.report.deleteMany({
      where: { id: { in: expired.map((report) => report.id) } },
    });
    deletedReports += result.count;

    if (expired.length < REPORT_PURGE_BATCH_SIZE) {
      break;
    }
  }

  return deletedReports;
}

export async function runMaintenanceTick(
  prisma: WorkerPrisma,
  now = new Date(),
): Promise<MaintenanceResult> {
  const [expiredInviteResult, expiredUploadSessionResult, deletedReports] =
    await Promise.all([
      prisma.invitation.updateMany({
        where: {
          status: InvitationStatus.pending,
          expiresAt: { lte: now },
        },
        data: { status: InvitationStatus.cancelled },
      }),
      prisma.uploadSession.count({
        where: {
          finalizedAt: null,
          expiresAt: { lte: now },
        },
      }),
      purgeExpiredReports(prisma, now),
    ]);

  return {
    cancelledInvites: expiredInviteResult.count,
    expiredUploadSessions: expiredUploadSessionResult,
    deletedReports,
    nowIso: now.toISOString(),
  };
}
