/**
 * Spotting marketing pricing tiers.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  SPOTTING_PLAN_MONTHLY_USD,
  SPOTTING_PLAN_YEARLY_USD,
} from "../constants/billing";

export type PricingTier = {
  name: string;
  slug: "free" | "pro" | "studio";
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  highlighted?: boolean;
  cta: string;
};

export const pricingTiers: PricingTier[] = [
  {
    name: "Free",
    slug: "free",
    description: "Self-hosted deployment",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "Self-hosted deployment",
      "Run on your own infrastructure",
      "All core capture features",
    ],
    cta: "Start for Free",
  },
  {
    name: "Pro",
    slug: "pro",
    description: "For growing teams with up to 15 members",
    monthlyPrice: SPOTTING_PLAN_MONTHLY_USD.pro,
    yearlyPrice: SPOTTING_PLAN_YEARLY_USD.pro,
    features: [
      "Up to 15 team members",
      "Unlimited bug reports",
      "Video and screenshot uploads",
      "Up to 10 minutes per recording",
      "Debugger timeline and network log",
      "Public or private share links",
    ],
    cta: "Choose Pro",
  },
  {
    name: "Studio",
    slug: "studio",
    description: "For teams that need unlimited seats",
    monthlyPrice: SPOTTING_PLAN_MONTHLY_USD.studio,
    yearlyPrice: SPOTTING_PLAN_YEARLY_USD.studio,
    features: [
      "Everything in Pro",
      "Unlimited team members",
      "Up to 20 minutes per recording",
    ],
    highlighted: true,
    cta: "Choose Studio",
  },
];
