import { beforeEach, describe, expect, it, mock } from "bun:test";
import { Hono } from "hono";
import {
  InviteRole,
  InvitationStatus,
  MembershipRole,
  ReportPriority,
  ReportVisibility,
} from "./prisma-exports";
import { FIXTURE_IDS, FIXTURE_TIME } from "./test/fixtures";

const prismaMock = {
  user: {
    findUnique: mock(async () => null),
    update: mock(async () => ({ id: FIXTURE_IDS.userOwner })),
    create: mock(async ({ data }: { data: { email: string; name: string } }) => ({
      id: FIXTURE_IDS.userOwner,
      email: data.email,
      name: data.name,
    })),
  },
  session: {
    create: mock(async () => ({ id: "session_1" })),
  },
  emailVerificationToken: {
    deleteMany: mock(async () => ({ count: 0 })),
    create: mock(async () => ({ id: "ev_1" })),
  },
  organization: {
    findUnique: mock(async () => null),
    create: mock(async ({ data }: { data: { name: string; slug: string } }) => ({
      id: FIXTURE_IDS.orgPrimary,
      name: data.name,
      slug: data.slug,
    })),
  },
  invitation: {
    create: mock(async ({ data }: { data: { email: string } }) => ({
      id: FIXTURE_IDS.invitePrimary,
      email: data.email,
      status: InvitationStatus.pending,
    })),
    findMany: mock(async () => [{ id: FIXTURE_IDS.invitePrimary, email: "new@spotting.dev" }]),
  },
  report: {
    findUnique: mock(async ({ where }: { where: { id: string } }) =>
      where.id === FIXTURE_IDS.reportPrimary
        ? { id: FIXTURE_IDS.reportPrimary, organizationId: FIXTURE_IDS.orgPrimary }
        : null,
    ),
    create: mock(async ({ data }: { data: { title: string; organizationId: string } }) => ({
      id: FIXTURE_IDS.reportPrimary,
      title: data.title,
      organizationId: data.organizationId,
    })),
  },
  uploadSession: {
    create: mock(async () => ({
      id: FIXTURE_IDS.uploadPrimary,
      uploadKey: `${FIXTURE_IDS.orgPrimary}/${FIXTURE_IDS.reportPrimary}/test.png`,
      expiresAt: FIXTURE_TIME.nextWeek,
    })),
  },
  membership: {
    findFirst: mock(async () => ({ organizationId: FIXTURE_IDS.orgPrimary })),
  },
};

mock.module("./db", () => ({ prisma: prismaMock }));
mock.module("./auth", () => ({
  requireSession: mock(async () => ({ userId: "user_1", token: "token_1" })),
  tryReadSession: mock(async () => ({ userId: "user_1", token: "token_1" })),
}));
mock.module("./permissions", () => ({
  requireOrgMembership: mock(async () => ({ organizationId: FIXTURE_IDS.orgPrimary, userId: FIXTURE_IDS.userOwner })),
  requireOrgRole: mock(async () => ({
    organizationId: FIXTURE_IDS.orgPrimary,
    userId: FIXTURE_IDS.userOwner,
    role: MembershipRole.owner,
  })),
}));
mock.module("./s3", () => ({
  createPresignedUploadUrl: mock(async () => ({ uploadUrl: "https://example.test/upload" })),
}));

const { v1 } = await import("./v1");

const app = new Hono();
app.route("/v1", v1);

describe("v1 integration routes", () => {
  beforeEach(() => {
    Object.values(prismaMock).forEach((section) =>
      Object.values(section).forEach((fn) => (fn as ReturnType<typeof mock>).mockClear()),
    );
  });

  it("handles signup endpoint", async () => {
    const response = await app.request("http://localhost/v1/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "owner@spotting.dev",
        password: "pass1234",
        name: "Owner",
      }),
    });

    expect(response.status).toBe(201);
    const payload = (await response.json()) as { user: { email: string }; sessionToken: string };
    expect(payload.user.email).toBe("owner@spotting.dev");
    expect(typeof payload.sessionToken).toBe("string");
  });

  it("handles org + invite + report + upload-session flows", async () => {
    const orgResponse = await app.request("http://localhost/v1/orgs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Acme", slug: "acme" }),
    });
    expect(orgResponse.status).toBe(201);

    const inviteResponse = await app.request(`http://localhost/v1/orgs/${FIXTURE_IDS.orgPrimary}/invites`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "new@spotting.dev", role: "member" }),
    });
    expect(inviteResponse.status).toBe(201);

    const listInvitesResponse = await app.request(
      `http://localhost/v1/orgs/${FIXTURE_IDS.orgPrimary}/invites`,
    );
    expect(listInvitesResponse.status).toBe(200);
    expect(await listInvitesResponse.json()).toEqual([
      { id: FIXTURE_IDS.invitePrimary, email: "new@spotting.dev" },
    ]);

    const reportResponse = await app.request("http://localhost/v1/reports", {
      method: "POST",
      headers: { "content-type": "application/json", "x-org-id": FIXTURE_IDS.orgPrimary },
      body: JSON.stringify({
        title: "Checkout fails",
        priority: ReportPriority.medium,
        visibility: ReportVisibility.private,
      }),
    });
    expect(reportResponse.status).toBe(201);

    const uploadResponse = await app.request("http://localhost/v1/reports/upload-sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        reportId: FIXTURE_IDS.reportPrimary,
        contentType: "image/png",
        fileName: "test.png",
      }),
    });
    expect(uploadResponse.status).toBe(200);
    expect(await uploadResponse.json()).toMatchObject({
      sessionId: FIXTURE_IDS.uploadPrimary,
      uploadUrl: "https://example.test/upload",
    });

    expect(prismaMock.invitation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: InviteRole.member,
          status: InvitationStatus.pending,
        }),
      }),
    );
  });
});
