// Backfill 80×80 WebP-thumbs для avatar_url'ов, у которых их ещё нет.
// Идемпотентен: пропускает аватары, для которых thumb уже существует.
// Запуск: npx tsx scripts/backfill-avatar-thumbs.ts

import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import { minioClient, MINIO_BUCKET } from "../src/lib/minio";

const prisma = new PrismaClient();

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

async function main() {
  const users = await prisma.user.findMany({
    where: { avatarUrl: { not: null } },
    select: { id: true, avatarUrl: true },
  });

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of users) {
    const key = user.avatarUrl!;
    if (key.startsWith("http")) {
      skipped++;
      continue;
    }
    const thumbKey = `${key}.thumb.webp`;

    try {
      await minioClient.statObject(MINIO_BUCKET, thumbKey);
      skipped++;
      continue;
    } catch {
      // Нет thumb — генерируем.
    }

    try {
      const origStream = await minioClient.getObject(MINIO_BUCKET, key);
      const origBuffer = await streamToBuffer(origStream);
      const thumbBuffer = await sharp(origBuffer)
        .resize(80, 80, { fit: "cover", position: "attention" })
        .webp({ quality: 60 })
        .toBuffer();
      await minioClient.putObject(
        MINIO_BUCKET,
        thumbKey,
        thumbBuffer,
        thumbBuffer.length,
        {
          "Content-Type": "image/webp",
          "Cache-Control": "public, max-age=31536000, immutable",
        }
      );
      console.log(`+ ${thumbKey} (${thumbBuffer.length}B)`);
      processed++;
    } catch (e) {
      console.error(`! ${key}:`, e instanceof Error ? e.message : e);
      failed++;
    }
  }

  console.log(`\nDone. processed=${processed} skipped=${skipped} failed=${failed}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
