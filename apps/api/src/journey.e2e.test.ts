import { beforeEach, describe, expect, it, mock } from "bun:test";
import { Hono } from "hono";
import { InvitationStatus, MembershipRole } from "./prisma-exports";
import { FIXTURE_IDS } from "./test/fixtures";

const prismaMock = {
  user: {
    findUnique: mock(async ({ where }: { where: { id?: string; email?: string } }) => {
      if (where.id === FIXTURE_IDS.userOwner) {
        return { id: FIXTURE_IDS.userOwner, email: "owner@spotting.dev", name: "Owner", passwordHash: "hash" };
      }
      if (where.email === "owner@spotting.dev") {
        return { id: FIXTURE_IDS.userOwner, email: "owner@spotting.dev", name: "Owner", passwordHash: "hash" };
      }
      return null;
    }),
  },
  session: {
    create: mock(async () => ({ id: "session_1" })),
    deleteMany: mock(async () => ({ count: 1 })),
  },
  membership: {
    findFirst: mock(async () => ({ organizationId: FIXTURE_IDS.orgPrimary })),
    findMany: mock(async () => [{ organizationId: FIXTURE_IDS.orgPrimary }]),
    findUnique: mock(async () => ({ role: MembershipRole.owner })),
  },
  invitation: {
    findUnique: mock(async () => ({
      id: FIXTURE_IDS.invitePrimary,
      email: "owner@spotting.dev",
      status: InvitationStatus.pending,
      expiresAt: new Date(Date.now() + 60_000),
      organizationId: FIXTURE_IDS.orgPrimary,
      role: "member",
    })),
    update: mock(async () => ({ ok: true })),
  },
  report: {
    findUnique: mock(async ({ where }: { where: { id: string } }) => ({
      id: where.id,
      organizationId: FIXTURE_IDS.orgPrimary,
      title: "R1",
      status: "open",
      visibility: "private",
      priority: "medium",
      uploadSessions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    findMany: mock(async () => []),
    count: mock(async () => 0),
  },
};

mock.module("./db", () => ({ prisma: prismaMock }));
mock.module("./auth", () => ({
  requireSession: mock(async () => ({ userId: FIXTURE_IDS.userOwner, token: "token_1" })),
  tryReadSession: mock(async () => ({ userId: FIXTURE_IDS.userOwner, token: "token_1" })),
}));
mock.module("./permissions", () => ({
  requireOrgMembership: mock(async () => ({ organizationId: FIXTURE_IDS.orgPrimary, userId: FIXTURE_IDS.userOwner })),
  requireOrgRole: mock(async () => ({
    organizationId: FIXTURE_IDS.orgPrimary,
    userId: FIXTURE_IDS.userOwner,
    role: MembershipRole.owner,
  })),
}));

const { v1 } = await import("./v1");

const app = new Hono();
app.route("/v1", v1);

describe("critical journey e2e", () => {
  beforeEach(() => {
    Object.values(prismaMock).forEach((section) =>
      Object.values(section).forEach((fn) => (fn as ReturnType<typeof mock>).mockClear()),
    );
  });

  it("covers auth me/signout + invite accept + report detail lifecycle", async () => {
    const meResponse = await app.request("http://localhost/v1/auth/me");
    expect(meResponse.status).toBe(200);
    expect(await meResponse.json()).toMatchObject({ id: FIXTURE_IDS.userOwner });

    const acceptInviteResponse = await app.request(
      `http://localhost/v1/orgs/invites/${FIXTURE_IDS.invitePrimary}/accept`,
      { method: "POST" },
    );
    expect(acceptInviteResponse.status).toBe(200);

    const reportDetailResponse = await app.request(`http://localhost/v1/reports/${FIXTURE_IDS.reportPrimary}`);
    expect(reportDetailResponse.status).toBe(200);
    expect(await reportDetailResponse.json()).toMatchObject({ id: FIXTURE_IDS.reportPrimary });

    const signoutResponse = await app.request("http://localhost/v1/auth/signout", { method: "POST" });
    expect(signoutResponse.status).toBe(200);
    expect(await signoutResponse.json()).toEqual({ ok: true });
  });
});
