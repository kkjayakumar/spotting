import {
  CreateBucketCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  type BucketLocationConstraint,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const bucketName = () => process.env.S3_BUCKET ?? "spotting-artifacts";

function isCustomEndpoint(): boolean {
  const endpoint = process.env.S3_ENDPOINT?.trim();
  return Boolean(endpoint);
}

function shouldAutoCreateBucket(): boolean {
  const flag = process.env.S3_AUTO_CREATE_BUCKET?.trim().toLowerCase();
  if (flag === "true") return true;
  if (flag === "false") return false;
  // Local MinIO: auto-create by default. Real AWS: bucket must exist.
  return isCustomEndpoint();
}

function resolveCredentials(): S3ClientConfig["credentials"] | undefined {
  const accessKeyId =
    process.env.S3_ACCESS_KEY?.trim() ||
    process.env.AWS_ACCESS_KEY_ID?.trim() ||
    "";
  const secretAccessKey =
    process.env.S3_SECRET_KEY?.trim() ||
    process.env.AWS_SECRET_ACCESS_KEY?.trim() ||
    "";

  if (accessKeyId && secretAccessKey) {
    return { accessKeyId, secretAccessKey };
  }

  // On AWS (ECS/Lambda/EC2), use the instance/task role via default credential chain.
  return undefined;
}

function createS3Client(): S3Client {
  const region = process.env.S3_REGION?.trim() || "us-east-1";
  const config: S3ClientConfig = { region };

  const endpoint = process.env.S3_ENDPOINT?.trim();
  if (endpoint) {
    config.endpoint = endpoint;
    // MinIO and most S3-compatible stores need path-style URLs.
    config.forcePathStyle =
      process.env.S3_FORCE_PATH_STYLE?.trim().toLowerCase() !== "false";
  }

  const credentials = resolveCredentials();
  if (credentials) {
    config.credentials = credentials;
  }

  return new S3Client(config);
}

const s3Client = createS3Client();

async function ensureBucket(): Promise<string> {
  const bucket = bucketName();
  if (!shouldAutoCreateBucket()) {
    return bucket;
  }

  const region = process.env.S3_REGION?.trim() || "us-east-1";

  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    const input: ConstructorParameters<typeof CreateBucketCommand>[0] = {
      Bucket: bucket,
    };
    if (region !== "us-east-1") {
      input.CreateBucketConfiguration = {
        LocationConstraint: region as BucketLocationConstraint,
      };
    }
    await s3Client.send(new CreateBucketCommand(input));
  }
  return bucket;
}

export async function createPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 900,
) {
  const bucket = await ensureBucket();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: expiresInSeconds,
  });

  return {
    uploadUrl,
    bucket,
  };
}

export async function putObjectBuffer(
  key: string,
  contentType: string,
  body: Uint8Array,
) {
  const bucket = await ensureBucket();
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return { bucket, key };
}

export async function createPresignedDownloadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 3600,
) {
  const bucket = await ensureBucket();
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentType: contentType,
  });
  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

export async function deleteS3Objects(keys: string[]): Promise<number> {
  const uniqueKeys = [...new Set(keys.map((key) => key.trim()).filter(Boolean))];
  if (uniqueKeys.length === 0) return 0;

  const bucket = bucketName();
  const result = await s3Client.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: uniqueKeys.map((Key) => ({ Key })),
        Quiet: true,
      },
    }),
  );

  return result.Deleted?.length ?? 0;
}

export async function deleteS3Prefix(prefix: string): Promise<number> {
  const normalizedPrefix = prefix.endsWith("/") ? prefix : `${prefix}/`;
  const bucket = bucketName();
  let deleted = 0;
  let continuationToken: string | undefined;

  do {
    const listing = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
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
