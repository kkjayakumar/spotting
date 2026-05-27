/**
 * Spotting organization subscription billing (DB-backed; payment provider optional later).
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  memberCapForPlan,
  SPOTTING_PLAN_LIMITS,
  type SpottingPlanSlug,
} from "@spotting/shared/constants/plan-limits";
import {
  BillingInterval,
  BillingPlan,
  SubscriptionStatus,
  type OrganizationSubscription,
} from "./prisma-exports";
import { prisma } from "./db";
import { apiError } from "./validation";

const PAID_PLANS: BillingPlan[] = [BillingPlan.pro, BillingPlan.studio];

function periodLengthMs(interval: BillingInterval): number {
  return interval === BillingInterval.yearly
    ? 1000 * 60 * 60 * 24 * 365
    : 1000 * 60 * 60 * 24 * 30;
}

function toPlanSlug(plan: BillingPlan): SpottingPlanSlug {
  return plan as SpottingPlanSlug;
}

export function getSpottingPlanLimitsResponse() {
  return SPOTTING_PLAN_LIMITS;
}

export async function ensureOrganizationSubscription(
  organizationId: string,
): Promise<OrganizationSubscription> {
  const existing = await prisma.organizationSubscription.findUnique({
    where: { organizationId },
  });
  if (existing) {
    return existing;
  }

  return prisma.organizationSubscription.create({
    data: {
      organizationId,
      plan: BillingPlan.pro,
      billingInterval: BillingInterval.monthly,
      status: SubscriptionStatus.active,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + periodLengthMs(BillingInterval.monthly)),
    },
  });
}

export async function getOrganizationBillingSnapshot(organizationId: string) {
  const subscription = await ensureOrganizationSubscription(organizationId);
  const memberCount = await prisma.membership.count({
    where: { organizationId },
  });

  const plan = toPlanSlug(subscription.plan);
  const memberCap = memberCapForPlan(plan);

  return {
    plan: subscription.plan,
    billingInterval: subscription.billingInterval,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    currentPeriodEnd: subscription.currentPeriodEnd,
    currentPeriodStart: subscription.currentPeriodStart,
    entitlements: { memberCap },
    memberCount,
    subscriptionStatus: subscription.status,
  };
}

function parsePaidPlan(value: string | undefined): BillingPlan {
  if (value === BillingPlan.pro || value === BillingPlan.studio) {
    return value;
  }
  throw apiError(400, "VALIDATION_ERROR", "Invalid plan", [
    { field: "plan", issue: "must be pro or studio" },
  ]);
}

function parseBillingInterval(value: string | undefined): BillingInterval {
  if (value === BillingInterval.monthly || value === BillingInterval.yearly) {
    return value;
  }
  return BillingInterval.monthly;
}

export async function changeOrganizationPlan(input: {
  organizationId: string;
  plan: string | undefined;
  billingInterval: string | undefined;
}) {
  const subscription = await ensureOrganizationSubscription(input.organizationId);
  const nextPlan = parsePaidPlan(optionalPlanString(input.plan));
  const nextInterval = parseBillingInterval(
    optionalIntervalString(input.billingInterval),
  );

  if (
    subscription.plan === nextPlan &&
    subscription.billingInterval === nextInterval &&
    subscription.status === SubscriptionStatus.active &&
    !subscription.cancelAtPeriodEnd
  ) {
    return { action: "unchanged" as const, plan: nextPlan };
  }

  if (
    subscription.cancelAtPeriodEnd &&
    subscription.plan === nextPlan &&
    subscription.billingInterval === nextInterval
  ) {
    throw apiError(
      409,
      "CONFLICT",
      "Subscription is scheduled to cancel. Resume it before changing plans.",
    );
  }

  const now = new Date();
  const periodEnd = new Date(now.getTime() + periodLengthMs(nextInterval));

  await prisma.organizationSubscription.update({
    where: { organizationId: input.organizationId },
    data: {
      plan: nextPlan,
      billingInterval: nextInterval,
      status: SubscriptionStatus.active,
      cancelAtPeriodEnd: false,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });

  return { action: "updated" as const, plan: nextPlan };
}

export async function scheduleOrganizationSubscriptionCancellation(
  organizationId: string,
) {
  const subscription = await ensureOrganizationSubscription(organizationId);

  if (subscription.plan === BillingPlan.free) {
    return { action: "none" as const };
  }

  if (subscription.cancelAtPeriodEnd) {
    return { action: "already_scheduled" as const };
  }

  await prisma.organizationSubscription.update({
    where: { organizationId },
    data: { cancelAtPeriodEnd: true },
  });

  return { action: "scheduled" as const };
}

export async function resumeOrganizationSubscription(organizationId: string) {
  const subscription = await ensureOrganizationSubscription(organizationId);

  if (subscription.plan === BillingPlan.free) {
    return { action: "none" as const };
  }

  if (!subscription.cancelAtPeriodEnd) {
    return { action: "already_active" as const };
  }

  await prisma.organizationSubscription.update({
    where: { organizationId },
    data: {
      cancelAtPeriodEnd: false,
      status: SubscriptionStatus.active,
    },
  });

  return { action: "resumed" as const };
}

function optionalPlanString(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

function optionalIntervalString(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

export function isPaidPlan(plan: BillingPlan): boolean {
  return PAID_PLANS.includes(plan);
}
