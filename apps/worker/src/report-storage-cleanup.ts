import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";
import type { PrismaClient } from "../../api/src/generated/prisma";

const bucketName = () => process.env.S3_BUCKET ?? "spotting-artifacts";

function createS3Client(): S3Client {
  const region = process.env.S3_REGION?.trim() || "us-east-1";
  const config: S3ClientConfig = { region };

  const endpoint = process.env.S3_ENDPOINT?.trim();
  if (endpoint) {
    config.endpoint = endpoint;
    config.forcePathStyle =
      process.env.S3_FORCE_PATH_STYLE?.trim().toLowerCase() !== "false";
  }

  const accessKeyId =
    process.env.S3_ACCESS_KEY?.trim() ||
    process.env.AWS_ACCESS_KEY_ID?.trim() ||
    "";
  const secretAccessKey =
    process.env.S3_SECRET_KEY?.trim() ||
    process.env.AWS_SECRET_ACCESS_KEY?.trim() ||
    "";

  if (accessKeyId && secretAccessKey) {
    config.credentials = { accessKeyId, secretAccessKey };
  }

  return new S3Client(config);
}

const s3Client = createS3Client();

async function deleteS3Objects(keys: string[]): Promise<number> {
  const uniqueKeys = [...new Set(keys.map((key) => key.trim()).filter(Boolean))];
  if (uniqueKeys.length === 0) {
    return 0;
  }

  const result = await s3Client.send(
    new DeleteObjectsCommand({
      Bucket: bucketName(),
      Delete: {
        Objects: uniqueKeys.map((Key) => ({ Key })),
        Quiet: true,
      },
    }),
  );

  return result.Deleted?.length ?? 0;
}

async function deleteS3Prefix(prefix: string): Promise<number> {
  const normalizedPrefix = prefix.endsWith("/") ? prefix : `${prefix}/`;
  let deleted = 0;
  let continuationToken: string | undefined;

  do {
    const listing = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: bucketName(),
        Prefix: normalizedPrefix,
        ContinuationToken: continuationToken,
      }),
    );

    const keys =
      listing.Contents?.map((item) => item.Key).filter(
        (key): key is string => typeof key === "string" && key.length > 0,
      ) ?? [];

    if (keys.length > 0) {
      deleted += await deleteS3Objects(keys);
    }

    continuationToken = listing.IsTruncated
      ? listing.NextContinuationToken
      : undefined;
  } while (continuationToken);

  return deleted;
}

export async function deleteReportStorageArtifacts(
  prisma: Pick<PrismaClient, "uploadSession">,
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
  prisma: Pick<PrismaClient, "uploadSession">,
  reports: Array<{ id: string; organizationId: string }>,
): Promise<void> {
  await Promise.all(
    reports.map((report) =>
      deleteReportStorageArtifacts(prisma, report.organizationId, report.id),
    ),
  );
}
