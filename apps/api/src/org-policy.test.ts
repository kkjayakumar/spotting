import { beforeEach, describe, expect, it, vi } from "vitest";
import { HTTPException } from "hono/http-exception";

const prismaMock = {
  membership: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  invitation: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  organization: {
    count: vi.fn(),
  },
};

vi.mock("./db", () => ({ prisma: prismaMock }));

const { assertUserCanCreateOrganization, getOnboardingState } = await import("./org-policy");

describe("org-policy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows bootstrap when no org exists and no pending invite", async () => {
    prismaMock.membership.findFirst.mockResolvedValue(null);
    prismaMock.invitation.findFirst.mockResolvedValue(null);
    prismaMock.organization.count.mockResolvedValue(0);

    await expect(
      assertUserCanCreateOrganization("user_1", "owner@spotting.dev"),
    ).resolves.toBeUndefined();
  });

  it("blocks org creation when workspace already exists", async () => {
    prismaMock.membership.findFirst.mockResolvedValue(null);
    prismaMock.invitation.findFirst.mockResolvedValue(null);
    prismaMock.organization.count.mockResolvedValue(1);

    await expect(assertUserCanCreateOrganization("user_2", "member@spotting.dev")).rejects.toBeInstanceOf(
      HTTPException,
    );
  });

  it("blocks org creation when user has a pending invite", async () => {
    prismaMock.membership.findFirst.mockResolvedValue(null);
    prismaMock.invitation.findFirst.mockResolvedValue({ id: "invite_1" });
    prismaMock.organization.count.mockResolvedValue(1);

    await expect(assertUserCanCreateOrganization("user_3", "invited@spotting.dev")).rejects.toBeInstanceOf(
      HTTPException,
    );
  });

  it("returns pending invites in onboarding state", async () => {
    prismaMock.organization.count.mockResolvedValue(1);
    prismaMock.membership.findMany.mockResolvedValue([]);
    prismaMock.invitation.findMany.mockResolvedValue([
      {
        id: "invite_1",
        email: "invited@spotting.dev",
        role: "member",
        organizationId: "org_1",
        organization: { name: "Spotting Team" },
        expiresAt: new Date(Date.now() + 60_000),
      },
    ]);

    const state = await getOnboardingState("user_4", "invited@spotting.dev");
    expect(state.canCreateOrganization).toBe(false);
    expect(state.pendingInvites).toHaveLength(1);
    expect(state.pendingInvites[0]?.organizationName).toBe("Spotting Team");
  });
});
