import * as Minio from "minio";

const globalForMinio = globalThis as unknown as { minioClient: Minio.Client | null };

function parseS3Endpoint(raw: string): { endPoint: string; port: number; useSSL: boolean } {
  try {
    const u = new URL(raw);
    return {
      endPoint: u.hostname,
      port: u.port ? parseInt(u.port, 10) : (u.protocol === "https:" ? 443 : 80),
      useSSL: u.protocol === "https:",
    };
  } catch {
    return { endPoint: raw, port: 9000, useSSL: false };
  }
}

function createMinioClient(): Minio.Client {
  // Support HETZNER_S3_* (primary) or MINIO_* (legacy) env vars
  const accessKey = process.env.MINIO_ACCESS_KEY || process.env.HETZNER_S3_ACCESS_KEY;
  const secretKey = process.env.MINIO_SECRET_KEY || process.env.HETZNER_S3_SECRET_KEY;
  const rawEndpoint = process.env.MINIO_ENDPOINT || process.env.HETZNER_S3_ENDPOINT;

  if (!accessKey || !secretKey) {
    if (process.env.NODE_ENV === "production") {
      console.error("FATAL: S3 credentials not set.");
      process.exit(1);
    }
    console.warn("WARNING: S3 credentials not set. Using dev fallback 'minioadmin'.");
  }

  const { endPoint, port, useSSL } = rawEndpoint
    ? parseS3Endpoint(rawEndpoint)
    : { endPoint: "localhost", port: 9000, useSSL: false };

  return new Minio.Client({
    endPoint,
    port,
    useSSL,
    accessKey: accessKey || "minioadmin",
    secretKey: secretKey || "minioadmin",
  });
}

export const minioClient = globalForMinio.minioClient || createMinioClient();

if (process.env.NODE_ENV !== "production") {
  globalForMinio.minioClient = minioClient;
}

export const MINIO_BUCKET =
  process.env.MINIO_BUCKET || process.env.HETZNER_S3_BUCKET || "p2ptax";

export async function ensureBucket() {
  const exists = await minioClient.bucketExists(MINIO_BUCKET);
  if (!exists) {
    await minioClient.makeBucket(MINIO_BUCKET);
  }
}

// Max presigned URL expiry allowed by S3-compatible storage is 7 days (604800s).
const PRESIGN_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Generate a fresh presigned GET URL for an avatar key.
 * avatarKey is the raw storage key, e.g. "avatars/1234-uuid.jpg".
 * Returns null if key is falsy (no avatar set).
 */
export async function presignAvatarUrl(avatarKey: string | null | undefined): Promise<string | null> {
  if (!avatarKey) return null;
  // If the value is already a full URL (legacy presigned URL), return as-is.
  if (avatarKey.startsWith("http")) return avatarKey;
  try {
    return await minioClient.presignedGetObject(MINIO_BUCKET, avatarKey, PRESIGN_EXPIRY_SECONDS);
  } catch {
    return null;
  }
}
