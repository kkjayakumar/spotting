import { describe, expect, it, vi } from "vitest";
import { InvitationStatus } from "../../api/src/generated/prisma";
import { runMaintenanceTick } from "./maintenance";

vi.mock("./report-storage-cleanup", () => ({
  deleteReportsStorageArtifacts: vi.fn(async () => undefined),
}));

describe("runMaintenanceTick", () => {
  it("cancels expired invites, counts upload sessions, and purges old reports", async () => {
    const updateMany = vi.fn(async () => ({ count: 2 }));
    const count = vi.fn(async () => 3);
    const findMany = vi
      .fn()
      .mockResolvedValueOnce([{ id: "r1", organizationId: "org1" }])
      .mockResolvedValueOnce([]);
    const deleteMany = vi.fn(async () => ({ count: 1 }));
    const now = new Date("2026-01-01T00:00:00.000Z");

    const result = await runMaintenanceTick(
      {
        invitation: { updateMany },
        uploadSession: { count },
        report: { findMany, deleteMany },
      } as never,
      now,
    );

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        status: InvitationStatus.pending,
        expiresAt: { lte: now },
      },
      data: { status: InvitationStatus.cancelled },
    });
    expect(count).toHaveBeenCalledWith({
      where: {
        finalizedAt: null,
        expiresAt: { lte: now },
      },
    });
    expect(findMany).toHaveBeenCalled();
    expect(deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["r1"] } },
    });
    expect(result).toEqual({
      cancelledInvites: 2,
      expiredUploadSessions: 3,
      deletedReports: 1,
      nowIso: now.toISOString(),
    });
  });
});
