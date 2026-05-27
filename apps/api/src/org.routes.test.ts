import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { MembershipRole } from "./prisma-exports";
import { FIXTURE_IDS } from "./test/fixtures";

const deleteOrganizationById = vi.fn(async () => undefined);

const prismaMock = {
  organization: {
    findUnique: vi.fn(async ({ where }: { where: { id?: string; slug?: string } }) => {
      if (where.id === FIXTURE_IDS.orgPrimary || where.slug === "acme") {
        return {
          id: FIXTURE_IDS.orgPrimary,
          name: "Acme",
          slug: "acme",
        };
      }
      return null;
    }),
    update: vi.fn(async ({ data }: { data: { name?: string; slug?: string } }) => ({
      id: FIXTURE_IDS.orgPrimary,
      name: data.name ?? "Acme",
      slug: data.slug ?? "acme",
    })),
  },
  report: {
    findMany: vi.fn(async () => []),
  },
  membership: {
    findUnique: vi.fn(async () => ({
      id: "member_1",
      organizationId: FIXTURE_IDS.orgPrimary,
      userId: FIXTURE_IDS.userOwner,
      role: MembershipRole.owner,
    })),
  },
};

vi.mock("./db", () => ({ prisma: prismaMock }));
vi.mock("./auth", () => ({
  requireSession: vi.fn(async () => ({
    userId: FIXTURE_IDS.userOwner,
    token: "token_1",
  })),
}));
vi.mock("./permissions", () => ({
  requireOrgMembership: vi.fn(async () => ({
    id: "member_1",
    organizationId: FIXTURE_IDS.orgPrimary,
    userId: FIXTURE_IDS.userOwner,
    role: MembershipRole.owner,
  })),
  requireOrgRole: vi.fn(async () => ({
    organizationId: FIXTURE_IDS.orgPrimary,
    userId: FIXTURE_IDS.userOwner,
    role: MembershipRole.owner,
  })),
}));
vi.mock("./org-cleanup", () => ({
  deleteOrganizationById,
}));

const { v1 } = await import("./v1");

const app = new Hono();
app.route("/v1", v1);

describe("organization routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the active membership role", async () => {
    const response = await app.request(
      `http://localhost/v1/orgs/${FIXTURE_IDS.orgPrimary}/membership`,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      role: MembershipRole.owner,
      memberId: "member_1",
      preferredReportGroupId: null,
    });
  });

  it("updates organization name and slug for owners", async () => {
    const response = await app.request(
      `http://localhost/v1/orgs/${FIXTURE_IDS.orgPrimary}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Acme QA", slug: "acme-qa" }),
      },
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: FIXTURE_IDS.orgPrimary,
      name: "Acme QA",
      slug: "acme-qa",
    });
  });

  it("deletes an organization for owners", async () => {
    const response = await app.request(
      `http://localhost/v1/orgs/${FIXTURE_IDS.orgPrimary}`,
      { method: "DELETE" },
    );
    expect(response.status).toBe(204);
    expect(deleteOrganizationById).toHaveBeenCalledWith(FIXTURE_IDS.orgPrimary);
  });
});
