/**
 * seed-landing-avatars.ts
 *
 * Uploads AI-generated specialist portraits to MinIO and points the 4 featured
 * specialists at them, replacing the placeholder Unsplash URLs.
 *
 * Run:
 *   doppler run -- npx tsx src/scripts/seed-landing-avatars.ts
 */
import { PrismaClient } from "@prisma/client";
import { minioClient, MINIO_BUCKET, ensureBucket } from "../lib/minio";
import * as fs from "node:fs";
import * as path from "node:path";

const prisma = new PrismaClient();

const SPECIALIST_IDS = {
  yulia:    "0ed05f10-a9f9-4e8d-9f35-a3920e5abaab",
  vladimir: "45790a39-0285-48d7-943c-bea399edc3f1",
  svetlana: "ca4f2c0f-491b-4791-bf4c-38f43122a6d1",
  yury:     "5ff5cac2-5bdb-4e52-b82b-10e72ad3e1c3",
};

const ASSETS_DIR = path.resolve(__dirname, "../../../assets/images/specialists");

async function uploadOne(key: keyof typeof SPECIALIST_IDS) {
  const file = path.join(ASSETS_DIR, `${key}.jpg`);
  if (!fs.existsSync(file)) throw new Error(`missing ${file}`);

  const buf = fs.readFileSync(file);
  const objectKey = `landing/${key}.jpg`;

  await minioClient.putObject(MINIO_BUCKET, objectKey, buf, buf.length, {
    "Content-Type": "image/jpeg",
    "Cache-Control": "public, max-age=31536000, immutable",
  });

  // Store full URL pointing at the API's MinIO proxy (api/src/index.ts:43).
  // The route streams the object out of MinIO, so the URL works without auth
  // and survives across dev/prod by reading the API base from env.
  const apiBase = process.env.PUBLIC_API_URL || "http://localhost:3812";
  const avatarUrl = `${apiBase}/${MINIO_BUCKET}/${objectKey}`;

  await prisma.user.update({
    where: { id: SPECIALIST_IDS[key] },
    data: { avatarUrl },
  });

  console.log(`  ${key.padEnd(10)} → ${objectKey} (${(buf.length / 1024).toFixed(0)} KB)`);
}

async function main() {
  console.log("=== seed-landing-avatars: uploading 4 portraits → MinIO ===");
  console.log(`  bucket: ${MINIO_BUCKET}`);

  await ensureBucket();

  for (const k of Object.keys(SPECIALIST_IDS) as (keyof typeof SPECIALIST_IDS)[]) {
    await uploadOne(k);
  }

  console.log("=== done ===");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
