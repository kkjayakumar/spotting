import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BillingInterval,
  BillingPlan,
  SubscriptionStatus,
} from "./prisma-exports";
import { FIXTURE_IDS } from "./test/fixtures";

const prismaMock = {
  organizationSubscription: {
    findUnique: vi.fn(async (): Promise<unknown> => null),
    create: vi.fn(async ({ data }: { data: { organizationId: string } }) => ({
      id: "sub_1",
      organizationId: data.organizationId,
      plan: BillingPlan.free,
      billingInterval: BillingInterval.monthly,
      status: SubscriptionStatus.none,
      cancelAtPeriodEnd: false,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "sub_1",
      organizationId: FIXTURE_IDS.orgPrimary,
      plan: data.plan ?? BillingPlan.pro,
      billingInterval: data.billingInterval ?? BillingInterval.monthly,
      status: data.status ?? SubscriptionStatus.active,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
      currentPeriodStart: data.currentPeriodStart ?? new Date(),
      currentPeriodEnd: data.currentPeriodEnd ?? new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  },
  membership: {
    count: vi.fn(async () => 4),
  },
};

vi.mock("./db", () => ({ prisma: prismaMock }));

const {
  changeOrganizationPlan,
  ensureOrganizationSubscription,
  getOrganizationBillingSnapshot,
  getSpottingPlanLimitsResponse,
  resumeOrganizationSubscription,
  scheduleOrganizationSubscriptionCancellation,
} = await import("./billing");

describe("billing service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a default free subscription when missing", async () => {
    const subscription = await ensureOrganizationSubscription(FIXTURE_IDS.orgPrimary);
    expect(subscription.plan).toBe(BillingPlan.free);
    expect(prismaMock.organizationSubscription.create).toHaveBeenCalled();
  });

  it("returns plan limits from shared constants", () => {
    const limits = getSpottingPlanLimitsResponse();
    expect(limits.pro.memberCap).toBe(15);
    expect(limits.pro.monthlyPriceUsd).toBe(25);
  });

  it("returns billing snapshot with member count", async () => {
    const snapshot = await getOrganizationBillingSnapshot(FIXTURE_IDS.orgPrimary);
    expect(snapshot.memberCount).toBe(4);
    expect(snapshot.plan).toBe(BillingPlan.free);
  });

  it("updates paid plan and billing interval", async () => {
    const result = await changeOrganizationPlan({
      organizationId: FIXTURE_IDS.orgPrimary,
      plan: "pro",
      billingInterval: "yearly",
    });
    expect(result.action).toBe("updated");
    expect(prismaMock.organizationSubscription.update).toHaveBeenCalled();
  });

  it("schedules cancellation for paid plans", async () => {
    prismaMock.organizationSubscription.findUnique.mockImplementation(async () => ({
      id: "sub_1",
      organizationId: FIXTURE_IDS.orgPrimary,
      plan: BillingPlan.pro,
      billingInterval: BillingInterval.monthly,
      status: SubscriptionStatus.active,
      cancelAtPeriodEnd: false,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = await scheduleOrganizationSubscriptionCancellation(
      FIXTURE_IDS.orgPrimary,
    );
    expect(result.action).toBe("scheduled");
  });

  it("resumes a canceled subscription", async () => {
    prismaMock.organizationSubscription.findUnique.mockImplementation(async () => ({
      id: "sub_1",
      organizationId: FIXTURE_IDS.orgPrimary,
      plan: BillingPlan.pro,
      billingInterval: BillingInterval.monthly,
      status: SubscriptionStatus.active,
      cancelAtPeriodEnd: true,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = await resumeOrganizationSubscription(FIXTURE_IDS.orgPrimary);
    expect(result.action).toBe("resumed");
  });
});
