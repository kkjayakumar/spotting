import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { InvitationStatus, MembershipRole } from "./prisma-exports";
import { FIXTURE_IDS } from "./test/fixtures";

const prismaMock = {
  user: {
    findUnique: vi.fn(async ({ where }: { where: { id?: string; email?: string } }) => {
      if (where.id === FIXTURE_IDS.userOwner) {
        return {
          id: FIXTURE_IDS.userOwner,
          email: "owner@spotting.dev",
          name: "Owner",
          passwordHash: "hash",
        };
      }
      if (where.email === "owner@spotting.dev") {
        return {
          id: FIXTURE_IDS.userOwner,
          email: "owner@spotting.dev",
          name: "Owner",
          passwordHash: "hash",
        };
      }
      return null;
    }),
  },
  session: {
    create: vi.fn(async () => ({ id: "session_1" })),
    deleteMany: vi.fn(async () => ({ count: 1 })),
  },
  membership: {
    findFirst: vi.fn(async () => ({ organizationId: FIXTURE_IDS.orgPrimary })),
    findMany: vi.fn(async () => [{ organizationId: FIXTURE_IDS.orgPrimary }]),
    findUnique: vi.fn(async () => ({ role: MembershipRole.owner })),
  },
  invitation: {
    findUnique: vi.fn(async () => ({
      id: FIXTURE_IDS.invitePrimary,
      email: "owner@spotting.dev",
      status: InvitationStatus.pending,
      expiresAt: new Date(Date.now() + 60_000),
      organizationId: FIXTURE_IDS.orgPrimary,
      role: "member",
    })),
    update: vi.fn(async () => ({ ok: true })),
  },
  report: {
    findUnique: vi.fn(async ({ where }: { where: { id: string } }) => ({
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
    findMany: vi.fn(async () => []),
    count: vi.fn(async () => 0),
  },
};

vi.mock("./db", () => ({ prisma: prismaMock }));
vi.mock("./auth", () => ({
  requireSession: vi.fn(async () => ({
    userId: FIXTURE_IDS.userOwner,
    token: "token_1",
  })),
  tryReadSession: vi.fn(async () => ({
    userId: FIXTURE_IDS.userOwner,
    token: "token_1",
  })),
}));
vi.mock("./permissions", () => ({
  requireOrgMembership: vi.fn(async () => ({
    organizationId: FIXTURE_IDS.orgPrimary,
    userId: FIXTURE_IDS.userOwner,
  })),
  requireOrgRole: vi.fn(async () => ({
    organizationId: FIXTURE_IDS.orgPrimary,
    userId: FIXTURE_IDS.userOwner,
    role: MembershipRole.owner,
  })),
}));
vi.mock("./report-artifacts", () => ({
  serializeReportForApi: vi.fn(async (report: { id: string }) => report),
  serializeReportsForApi: vi.fn(async (reports: Array<{ id: string }>) => reports),
}));

const { v1 } = await import("./v1");

const app = new Hono();
app.route("/v1", v1);

function clearMocks(section: Record<string, ReturnType<typeof vi.fn>>) {
  Object.values(section).forEach((fn) => fn.mockClear());
}

describe("critical journey e2e", () => {
  beforeEach(() => {
    Object.values(prismaMock).forEach((section) => clearMocks(section));
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

    const reportDetailResponse = await app.request(
      `http://localhost/v1/reports/${FIXTURE_IDS.reportPrimary}`,
    );
    expect(reportDetailResponse.status).toBe(200);
    expect(await reportDetailResponse.json()).toMatchObject({
      id: FIXTURE_IDS.reportPrimary,
    });

    const signoutResponse = await app.request("http://localhost/v1/auth/signout", {
      method: "POST",
    });
    expect(signoutResponse.status).toBe(200);
    expect(await signoutResponse.json()).toEqual({ ok: true });
  });
});
