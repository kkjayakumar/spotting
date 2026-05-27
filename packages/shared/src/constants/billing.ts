/**
 * Spotting subscription list prices (USD).
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export const SPOTTING_PLAN_MONTHLY_USD = {
  free: 0,
  pro: 25,
  studio: 49,
} as const;

export const SPOTTING_PLAN_YEARLY_USD = {
  free: 0,
  pro: 250,
  studio: 490,
} as const;

/** @deprecated Use SPOTTING_PLAN_MONTHLY_USD */
export const billingPlanMonthlyBasePriceUsd = SPOTTING_PLAN_MONTHLY_USD;

/** @deprecated Use SPOTTING_PLAN_YEARLY_USD */
export const billingPlanYearlyBasePriceUsd = SPOTTING_PLAN_YEARLY_USD;
