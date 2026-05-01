/**
 * recompute-response-times.ts
 *
 * One-shot/cron script. For each specialist, computes the median time
 * between request creation (or thread creation when requestId is null)
 * and the specialist's first message in the thread.
 *
 * Specialists with fewer than 5 closed/active threads with at least one
 * specialist response are left as null (insufficient data — UI hides
 * the SLA chip).
 *
 * Run:
 *   doppler run -- npx tsx src/scripts/recompute-response-times.ts
 *
 * For landing specialists with hand-curated values, this script SKIPS
 * the override iff cachedAvgResponseMinutes is already set AND
 * verifiedExFns is true (treat seed values as ground truth until enough
 * organic data accumulates).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MIN_SAMPLE_SIZE = 5;

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

async function main() {
  console.log("=== recompute-response-times: starting ===");

  const specialists = await prisma.user.findMany({
    where: { isSpecialist: true, deletedAt: null },
    select: { id: true, firstName: true, lastName: true },
  });

  let updated = 0;
  let skippedSeed = 0;
  let insufficient = 0;

  for (const sp of specialists) {
    // Threads where this user is the specialist, with their first message
    const threads = await prisma.thread.findMany({
      where: { specialistId: sp.id, deletedAt: null },
      select: {
        id: true,
        createdAt: true,
        request: { select: { createdAt: true } },
        messages: {
          where: { senderId: sp.id },
          orderBy: { createdAt: "asc" },
          take: 1,
          select: { createdAt: true },
        },
      },
    });

    const samples: number[] = [];
    for (const t of threads) {
      const firstMsg = t.messages[0]?.createdAt;
      if (!firstMsg) continue;
      const startAt = t.request?.createdAt ?? t.createdAt;
      const diffMin = Math.max(1, Math.round((firstMsg.getTime() - startAt.getTime()) / 60_000));
      samples.push(diffMin);
    }

    if (samples.length < MIN_SAMPLE_SIZE) {
      // Don't overwrite a seeded value just because organic samples are sparse
      const existing = await prisma.specialistProfile.findUnique({
        where: { userId: sp.id },
        select: { cachedAvgResponseMinutes: true, verifiedExFns: true },
      });
      if (existing?.cachedAvgResponseMinutes != null && existing.verifiedExFns) {
        skippedSeed++;
        continue;
      }
      // Otherwise null it out (no fake numbers)
      if (existing) {
        await prisma.specialistProfile.update({
          where: { userId: sp.id },
          data: { cachedAvgResponseMinutes: null },
        });
      }
      insufficient++;
      continue;
    }

    const med = median(samples);
    if (med == null) continue;

    await prisma.specialistProfile.upsert({
      where: { userId: sp.id },
      update: { cachedAvgResponseMinutes: med },
      create: { userId: sp.id, cachedAvgResponseMinutes: med },
    });
    updated++;
  }

  console.log(
    `=== done: updated=${updated} skippedSeed=${skippedSeed} insufficient=${insufficient} total=${specialists.length} ===`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
