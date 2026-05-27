/**
 * Spotting plan entitlements (single source of truth).
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  SPOTTING_PLAN_MONTHLY_USD,
  SPOTTING_PLAN_YEARLY_USD,
} from "./billing";

export type SpottingPlanSlug = "free" | "pro" | "studio";

export type SpottingPlanLimit = {
  monthlyPriceUsd: number;
  yearlyPriceUsd: number;
  canUploadVideo: boolean;
  maxVideoDurationMs: number | null;
  memberCap: number | null;
};

export const SPOTTING_PLAN_LIMITS: Record<SpottingPlanSlug, SpottingPlanLimit> = {
  free: {
    monthlyPriceUsd: SPOTTING_PLAN_MONTHLY_USD.free,
    yearlyPriceUsd: SPOTTING_PLAN_YEARLY_USD.free,
    canUploadVideo: false,
    maxVideoDurationMs: null,
    memberCap: 3,
  },
  pro: {
    monthlyPriceUsd: SPOTTING_PLAN_MONTHLY_USD.pro,
    yearlyPriceUsd: SPOTTING_PLAN_YEARLY_USD.pro,
    canUploadVideo: true,
    maxVideoDurationMs: 600_000,
    memberCap: 15,
  },
  studio: {
    monthlyPriceUsd: SPOTTING_PLAN_MONTHLY_USD.studio,
    yearlyPriceUsd: SPOTTING_PLAN_YEARLY_USD.studio,
    canUploadVideo: true,
    maxVideoDurationMs: 1_200_000,
    memberCap: null,
  },
};

export function memberCapForPlan(plan: SpottingPlanSlug): number | null {
  return SPOTTING_PLAN_LIMITS[plan].memberCap;
}
