import { prisma } from "./db";
import { deleteS3Objects, deleteS3Prefix } from "./s3";

export async function deleteReportStorageArtifacts(
  organizationId: string,
  reportId: string,
): Promise<void> {
  const sessions = await prisma.uploadSession.findMany({
    where: { reportId },
    select: { uploadKey: true },
  });

  const keys = sessions.map((session) => session.uploadKey);
  if (keys.length > 0) {
    await deleteS3Objects(keys);
  }

  await deleteS3Prefix(`${organizationId}/${reportId}`);
}

export async function deleteReportsStorageArtifacts(
  reports: Array<{ id: string; organizationId: string }>,
): Promise<void> {
  await Promise.all(
    reports.map((report) =>
      deleteReportStorageArtifacts(report.organizationId, report.id),
    ),
  );
}
