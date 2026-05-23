import { describe, expect, it, mock } from "bun:test";
import { InvitationStatus } from "@prisma/client";
import { runMaintenanceTick } from "./maintenance";

describe("runMaintenanceTick", () => {
  it("cancels expired invites and counts expired upload sessions", async () => {
    const updateMany = mock(async () => ({ count: 2 }));
    const count = mock(async () => 3);
    const now = new Date("2026-01-01T00:00:00.000Z");

    const result = await runMaintenanceTick(
      {
        invitation: { updateMany },
        uploadSession: { count },
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
    expect(result).toEqual({
      cancelledInvites: 2,
      expiredUploadSessions: 3,
      nowIso: now.toISOString(),
    });
  });
});
