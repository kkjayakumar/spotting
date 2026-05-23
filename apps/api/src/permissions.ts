import { MembershipRole } from "./prisma-exports";
import { prisma } from "./db";
import { apiError } from "./validation";

export async function requireOrgMembership(userId: string, orgId: string) {
  const membership = await prisma.membership.findUnique({
    where: { organizationId_userId: { organizationId: orgId, userId } },
  });
  if (!membership) {
    throw apiError(403, "FORBIDDEN", "Membership required");
  }
  return membership;
}

export async function requireOrgRole(
  userId: string,
  orgId: string,
  roles: MembershipRole[],
) {
  const membership = await requireOrgMembership(userId, orgId);
  if (!roles.includes(membership.role)) {
    throw apiError(403, "FORBIDDEN", `Required role: ${roles.join(" or ")}`);
  }
  return membership;
}
