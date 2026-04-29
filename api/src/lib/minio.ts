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
