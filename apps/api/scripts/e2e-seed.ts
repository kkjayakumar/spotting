/**
 * Deterministic E2E seed for Playwright (capture → viewer → dashboard).
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { loadApiEnv } from "../src/load-env.js";

loadApiEnv();

import {
  BillingInterval,
  BillingPlan,
  MembershipRole,
  SubscriptionStatus,
} from "../src/prisma-exports.js";
import { prisma } from "../src/db.js";
import { hashPassword } from "../src/password.js";

export const E2E_SEED = {
  email: "e2e@spotting.test",
  password: "e2e-test-password",
  name: "E2E User",
  orgName: "E2E Organization",
  orgSlug: "e2e-org",
  captureKeyToken: "spk_live_e2e000000000000000000000000",
  captureKeyLabel: "E2E Playwright",
  allowedOrigin: "http://localhost:3003",
} as const;

async function main() {
  const passwordHash = await hashPassword(E2E_SEED.password);

  await prisma.capturePublicKey.deleteMany({
    where: { token: E2E_SEED.captureKeyToken },
  });
  await prisma.membership.deleteMany({
    where: { user: { email: E2E_SEED.email } },
  });
  await prisma.organizationSubscription.deleteMany({
    where: { organization: { slug: E2E_SEED.orgSlug } },
  });
  await prisma.organization.deleteMany({ where: { slug: E2E_SEED.orgSlug } });
  await prisma.session.deleteMany({
    where: { user: { email: E2E_SEED.email } },
  });
  await prisma.user.deleteMany({ where: { email: E2E_SEED.email } });

  const user = await prisma.user.create({
    data: {
      email: E2E_SEED.email,
      name: E2E_SEED.name,
      passwordHash,
      emailVerifiedAt: new Date(),
    },
  });

  const organization = await prisma.organization.create({
    data: {
      name: E2E_SEED.orgName,
      slug: E2E_SEED.orgSlug,
      memberships: {
        create: {
          userId: user.id,
          role: MembershipRole.owner,
        },
      },
      subscription: {
        create: {
          plan: BillingPlan.pro,
          billingInterval: BillingInterval.monthly,
          status: SubscriptionStatus.active,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        },
      },
      capturePublicKeys: {
        create: {
          token: E2E_SEED.captureKeyToken,
          label: E2E_SEED.captureKeyLabel,
          allowedOrigins: [E2E_SEED.allowedOrigin],
        },
      },
    },
  });

  console.log("E2E seed complete", {
    userId: user.id,
    organizationId: organization.id,
    email: E2E_SEED.email,
    captureKey: E2E_SEED.captureKeyToken,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
