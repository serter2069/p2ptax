// Backfill 800px WebP-thumbs для files.url (image/*), у которых
// files.thumb_url пустой. Идемпотентно, пропускает external (https://)
// и уже обработанные.
// Запуск: npx tsx scripts/backfill-file-thumbs.ts

import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import { minioClient, MINIO_BUCKET } from "../src/lib/minio";

const prisma = new PrismaClient();

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

function urlToKey(url: string): string | null {
  if (!url.startsWith("/")) return null;
  const prefix = `/${MINIO_BUCKET}/`;
  if (!url.startsWith(prefix)) return null;
  return url.slice(prefix.length);
}

async function main() {
  const files = await prisma.file.findMany({
    where: {
      mimeType: { startsWith: "image/" },
      thumbUrl: null,
    },
    select: { id: true, url: true, mimeType: true },
  });

  let processed = 0;
  let skippedExternal = 0;
  let skippedMissing = 0;
  let failed = 0;

  for (const f of files) {
    const key = urlToKey(f.url);
    if (!key) {
      skippedExternal++;
      continue;
    }
    const thumbKey = `${key}.thumb.webp`;

    try {
      const origStream = await minioClient.getObject(MINIO_BUCKET, key);
      const origBuffer = await streamToBuffer(origStream);
      const thumbBuffer = await sharp(origBuffer)
        .rotate()
        .resize(800, 800, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 70 })
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
      await prisma.file.update({
        where: { id: f.id },
        data: { thumbUrl: `/${MINIO_BUCKET}/${thumbKey}` },
      });
      console.log(`+ ${thumbKey} (${thumbBuffer.length}B)`);
      processed++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("does not exist") || msg.includes("NoSuchKey")) {
        // Файл когда-то был, но MinIO-объект удалён — обновляем БД пустым,
        // чтобы перестать показывать как «есть thumb».
        skippedMissing++;
      } else {
        console.error(`! ${key}: ${msg}`);
        failed++;
      }
    }
  }

  console.log(
    `\nDone. processed=${processed} skippedExternal=${skippedExternal} skippedMissing=${skippedMissing} failed=${failed}`
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
