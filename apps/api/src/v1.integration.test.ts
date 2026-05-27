import { beforeEach, describe, expect, it, vi } from "vitest";
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
    findUnique: vi.fn(async ({ where }: { where: { id?: string; email?: string } }) => {
      if (where.email) return null;
      if (where.id === FIXTURE_IDS.userOwner || where.id === "user_1") {
        return {
          id: FIXTURE_IDS.userOwner,
          email: "owner@spotting.dev",
          name: "Owner",
        };
      }
      return null;
    }),
    update: vi.fn(async () => ({ id: FIXTURE_IDS.userOwner })),
    create: vi.fn(async ({ data }: { data: { email: string; name: string } }) => ({
      id: FIXTURE_IDS.userOwner,
      email: data.email,
      name: data.name,
    })),
  },
  session: {
    create: vi.fn(async () => ({ id: "session_1" })),
  },
  emailVerificationToken: {
    deleteMany: vi.fn(async () => ({ count: 0 })),
    create: vi.fn(async () => ({ id: "ev_1" })),
  },
  organization: {
    count: vi.fn(async () => 0),
    findUnique: vi.fn(async ({ where }: { where: { id?: string; slug?: string } }) => {
      if (where.id === FIXTURE_IDS.orgPrimary) {
        return {
          id: FIXTURE_IDS.orgPrimary,
          name: "Acme",
          slug: "acme",
        };
      }
      return null;
    }),
    create: vi.fn(async ({ data }: { data: { name: string; slug: string } }) => ({
      id: FIXTURE_IDS.orgPrimary,
      name: data.name,
      slug: data.slug,
    })),
  },
  invitation: {
    findFirst: vi.fn(async () => null),
    create: vi.fn(async ({ data }: { data: { email: string } }) => ({
      id: FIXTURE_IDS.invitePrimary,
      email: data.email,
      status: InvitationStatus.pending,
    })),
    findMany: vi.fn(async () => [
      { id: FIXTURE_IDS.invitePrimary, email: "new@spotting.dev" },
    ]),
  },
  report: {
    findUnique: vi.fn(async ({ where }: { where: { id: string } }) =>
      where.id === FIXTURE_IDS.reportPrimary
        ? { id: FIXTURE_IDS.reportPrimary, organizationId: FIXTURE_IDS.orgPrimary }
        : null,
    ),
    create: vi.fn(async ({ data }: { data: { title: string; organizationId: string } }) => ({
      id: FIXTURE_IDS.reportPrimary,
      title: data.title,
      organizationId: data.organizationId,
    })),
  },
  uploadSession: {
    create: vi.fn(async () => ({
      id: FIXTURE_IDS.uploadPrimary,
      uploadKey: `${FIXTURE_IDS.orgPrimary}/${FIXTURE_IDS.reportPrimary}/test.png`,
      expiresAt: FIXTURE_TIME.nextWeek,
    })),
  },
  membership: {
    findFirst: vi.fn(async () => null),
    findUnique: vi.fn(async () => ({
      id: "member_1",
      organizationId: FIXTURE_IDS.orgPrimary,
      userId: FIXTURE_IDS.userOwner,
      role: MembershipRole.owner,
      preferredReportGroupId: null,
    })),
  },
  organizationSubscription: {
    findUnique: vi.fn(async () => null),
    create: vi.fn(async ({ data }: { data: { organizationId: string } }) => ({
      id: "sub_1",
      organizationId: data.organizationId,
      plan: "pro",
      billingInterval: "monthly",
      status: "active",
      cancelAtPeriodEnd: false,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  },
};

vi.mock("./db", () => ({ prisma: prismaMock }));
vi.mock("./auth", () => ({
  requireSession: vi.fn(async () => ({ userId: "user_1", token: "token_1" })),
  tryReadSession: vi.fn(async () => ({ userId: "user_1", token: "token_1" })),
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
vi.mock("./s3", () => ({
  createPresignedUploadUrl: vi.fn(async () => ({
    uploadUrl: "https://example.test/upload",
  })),
  deleteS3Objects: vi.fn(async () => 0),
  deleteS3Prefix: vi.fn(async () => 0),
}));
vi.mock("./email-verification", () => ({
  issueAndSendEmailVerificationOtp: vi.fn(async () => ({ otp: "123456" })),
  mapVerificationError: vi.fn(),
  verifyEmailOtp: vi.fn(),
}));
vi.mock("./email", () => ({
  isEmailConfigured: vi.fn(() => false),
  sendOrganizationInviteEmail: vi.fn(async () => true),
}));

const { v1 } = await import("./v1");

const app = new Hono();
app.route("/v1", v1);

function clearMocks(section: Record<string, ReturnType<typeof vi.fn>>) {
  Object.values(section).forEach((fn) => fn.mockClear());
}

describe("v1 integration routes", () => {
  beforeEach(() => {
    Object.values(prismaMock).forEach((section) => clearMocks(section));
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
    const payload = (await response.json()) as {
      user: { email: string };
      sessionToken: string;
    };
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

    const inviteResponse = await app.request(
      `http://localhost/v1/orgs/${FIXTURE_IDS.orgPrimary}/invites`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "new@spotting.dev", role: "member" }),
      },
    );
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
      headers: {
        "content-type": "application/json",
        "x-org-id": FIXTURE_IDS.orgPrimary,
      },
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
