import { InvitationStatus, type PrismaClient } from "@prisma/client";

export type WorkerPrisma = Pick<PrismaClient, "invitation" | "uploadSession">;

export type MaintenanceResult = {
  cancelledInvites: number;
  expiredUploadSessions: number;
  nowIso: string;
};

export async function runMaintenanceTick(prisma: WorkerPrisma, now = new Date()): Promise<MaintenanceResult> {
  const [expiredInviteResult, expiredUploadSessionResult] = await Promise.all([
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
  ]);

  return {
    cancelledInvites: expiredInviteResult.count,
    expiredUploadSessions: expiredUploadSessionResult,
    nowIso: now.toISOString(),
  };
}
