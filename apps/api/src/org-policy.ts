/**
 * Single-organization access policy.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * One workspace org is bootstrapped by the first user; everyone else joins via invite.
 */

import { InvitationStatus } from "./prisma-exports";
import { prisma } from "./db";
import { apiError } from "./validation";

export async function assertUserCanCreateOrganization(
  userId: string,
  email: string,
): Promise<void> {
  const existingMembership = await prisma.membership.findFirst({
    where: { userId },
  });
  if (existingMembership) {
    throw apiError(409, "CONFLICT", "You already belong to a workspace.");
  }

  const pendingInvite = await prisma.invitation.findFirst({
    where: {
      email,
      status: InvitationStatus.pending,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });
  if (pendingInvite) {
    throw apiError(
      403,
      "FORBIDDEN",
      "You have a pending invitation. Accept it to join your team workspace.",
    );
  }

  const organizationCount = await prisma.organization.count();
  if (organizationCount > 0) {
    throw apiError(
      403,
      "FORBIDDEN",
      "Workspace creation is disabled. Ask an administrator to send you an invitation.",
    );
  }
}

export async function getOnboardingState(userId: string, email: string) {
  const [organizationCount, memberships, pendingInvites] = await Promise.all([
    prisma.organization.count(),
    prisma.membership.findMany({
      where: { userId },
      include: { organization: true },
    }),
    prisma.invitation.findMany({
      where: {
        email,
        status: InvitationStatus.pending,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: { organization: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const canCreateOrganization =
    organizationCount === 0 &&
    memberships.length === 0 &&
    pendingInvites.length === 0;

  return {
    canCreateOrganization,
    organizationExists: organizationCount > 0,
    pendingInvites: pendingInvites.map((invite) => ({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      organizationId: invite.organizationId,
      organizationName: invite.organization.name,
      expiresAt: invite.expiresAt?.toISOString() ?? null,
    })),
  };
}
