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

// Email-based lookup — UUIDs differ across DBs (local vs staging seed).
// Emails are deterministic from prisma/seed-specialists.ts.
const SPECIALIST_EMAILS = {
  yulia:    "yulia.zaitseva@p2ptax-seed.ru",
  vladimir: "vladimir.lebedev@p2ptax-seed.ru",
  svetlana: "svetlana.orlova@p2ptax-seed.ru",
  yury:     "yuriy.kondratyev@p2ptax-seed.ru",
} as const;

const ASSETS_DIR = path.resolve(__dirname, "../../../assets/images/specialists");

async function uploadOne(key: keyof typeof SPECIALIST_EMAILS) {
  const file = path.join(ASSETS_DIR, `${key}.jpg`);
  if (!fs.existsSync(file)) throw new Error(`missing ${file}`);

  const email = SPECIALIST_EMAILS[key];
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) {
    console.warn(`  ${key.padEnd(10)} → SKIP (no user with email=${email})`);
    return;
  }

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
    where: { id: user.id },
    data: { avatarUrl },
  });

  console.log(`  ${key.padEnd(10)} → ${objectKey} (${(buf.length / 1024).toFixed(0)} KB)`);
}

async function main() {
  console.log("=== seed-landing-avatars: uploading 4 portraits → MinIO ===");
  console.log(`  bucket: ${MINIO_BUCKET}`);

  await ensureBucket();

  for (const k of Object.keys(SPECIALIST_EMAILS) as (keyof typeof SPECIALIST_EMAILS)[]) {
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
