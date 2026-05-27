import { prisma } from "./db";
import { apiError, optionalTrimmedString } from "./validation";

import type { Prisma } from "./prisma-exports";

export async function resolveOptionalReportGroupId(
  organizationId: string,
  raw: unknown,
): Promise<string | null | undefined> {
  if (raw === undefined) {
    return undefined;
  }
  if (raw === null) {
    return null;
  }
  const groupId = optionalTrimmedString(typeof raw === "string" ? raw : undefined);
  if (!groupId) {
    return null;
  }
  const group = await prisma.reportGroup.findFirst({
    where: { id: groupId, organizationId },
    select: { id: true },
  });
  if (!group) {
    throw apiError(404, "NOT_FOUND", "Report group not found");
  }
  return groupId;
}

export async function resolveReportGroupIdForCreate(
  organizationId: string,
  userId: string | null,
  explicitGroupId: unknown,
): Promise<string | null | undefined> {
  const explicit = await resolveOptionalReportGroupId(organizationId, explicitGroupId);
  if (explicit !== undefined) {
    return explicit;
  }
  if (!userId) {
    return undefined;
  }
  const membership = await prisma.membership.findUnique({
    where: {
      organizationId_userId: { organizationId, userId },
    },
    select: { preferredReportGroupId: true },
  });
  if (!membership?.preferredReportGroupId) {
    return undefined;
  }
  return resolveOptionalReportGroupId(
    organizationId,
    membership.preferredReportGroupId,
  );
}

export function reportGroupFilter(
  groupIdQuery: string | undefined,
): Prisma.ReportWhereInput {
  if (!groupIdQuery) {
    return {};
  }
  if (groupIdQuery === "none") {
    return { groupId: null };
  }
  return { groupId: groupIdQuery };
}

export function serializeReportGroup(row: {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  _count?: { reports: number };
}) {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sortOrder,
    reportCount: row._count?.reports ?? 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
