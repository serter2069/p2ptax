import * as Minio from "minio";

const globalForMinio = globalThis as unknown as { minioClient: Minio.Client | null };

function createMinioClient(): Minio.Client {
  const accessKey = process.env.MINIO_ACCESS_KEY;
  const secretKey = process.env.MINIO_SECRET_KEY;

  if (!accessKey || !secretKey) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "FATAL: MINIO_ACCESS_KEY and MINIO_SECRET_KEY environment variables are required in production."
      );
      process.exit(1);
    }
    console.warn(
      "WARNING: MINIO_ACCESS_KEY / MINIO_SECRET_KEY not set. Using dev fallback 'minioadmin'. Set these in production."
    );
  }

  return new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || "localhost",
    port: parseInt(process.env.MINIO_PORT || "9000", 10),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: accessKey || "minioadmin",
    secretKey: secretKey || "minioadmin",
  });
}

export const minioClient = globalForMinio.minioClient || createMinioClient();

if (process.env.NODE_ENV !== "production") {
  globalForMinio.minioClient = minioClient;
}

export const MINIO_BUCKET = process.env.MINIO_BUCKET || "p2ptax";

export async function ensureBucket() {
  const exists = await minioClient.bucketExists(MINIO_BUCKET);
  if (!exists) {
    await minioClient.makeBucket(MINIO_BUCKET);
  }
}
