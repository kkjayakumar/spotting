import { prisma } from "./db";
import { deleteReportsStorageArtifacts } from "./report-cleanup";
import { deleteS3Prefix } from "./s3";

export async function deleteOrganizationStorageArtifacts(
  organizationId: string,
): Promise<void> {
  const reports = await prisma.report.findMany({
    where: { organizationId },
    select: { id: true, organizationId: true },
  });

  await deleteReportsStorageArtifacts(reports);
  await deleteS3Prefix(organizationId);
}

export async function deleteOrganizationById(organizationId: string): Promise<void> {
  await deleteOrganizationStorageArtifacts(organizationId);
  await prisma.organization.delete({ where: { id: organizationId } });
}
