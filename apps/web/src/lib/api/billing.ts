import { SPOTTING_PLAN_LIMITS } from "@spotting/shared/constants/plan-limits";

import { fetchApi } from "@/lib/api-fetch";

export const billingClient = {
  getCurrentOrganizationPlan: async (input?: { organizationId?: string }) => {
    const orgId = input?.organizationId;
    if (!orgId) {
      throw new Error("organizationId is required");
    }
    return fetchApi(`/v1/orgs/${orgId}/billing/plan`);
  },
  getPlanLimits: async () => fetchApi("/v1/billing/plan-limits"),
  listPlans: async () => Object.entries(SPOTTING_PLAN_LIMITS).map(([slug, limits]) => ({
    slug,
    ...limits,
  })),
  createCheckoutSession: async () => {
    throw new Error("Checkout is managed via changePlan for self-hosted billing.");
  },
  changePlan: async (input: {
    organizationId: string;
    plan: string;
    billingInterval: string;
  }) =>
    fetchApi(`/v1/orgs/${input.organizationId}/billing/change-plan`, {
      method: "POST",
      body: JSON.stringify({
        plan: input.plan,
        billingInterval: input.billingInterval,
      }),
    }),
  openPortal: async (input: { organizationId: string }) =>
    fetchApi(`/v1/orgs/${input.organizationId}/billing/portal`, {
      method: "POST",
    }),
  cancelSubscription: async (input: { organizationId: string }) =>
    fetchApi(`/v1/orgs/${input.organizationId}/billing/cancel`, {
      method: "POST",
    }),
  uncancelSubscription: async (input: { organizationId: string }) =>
    fetchApi(`/v1/orgs/${input.organizationId}/billing/uncancel`, {
      method: "POST",
    }),
};
