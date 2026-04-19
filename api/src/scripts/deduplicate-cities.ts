/**
 * Deduplication script for city records.
 *
 * Problem: DB may have duplicate city entries for the same city —
 * one with a Cyrillic slug (e.g. "москва") and one with a Latin slug
 * (e.g. "moskva" or "moscow").
 *
 * Strategy:
 * 1. Load all cities.
 * 2. Group by normalized city name (case-insensitive).
 * 3. For each group with >1 record, pick the canonical record:
 *    - Prefer the one with a Latin-only slug.
 *    - Among Latin slugs, prefer shorter/cleaner one.
 * 4. Re-point all FnsOffice and Request FK references from duplicate IDs
 *    to the canonical ID.
 * 5. Delete duplicate city records.
 *
 * Run: npx ts-node src/scripts/deduplicate-cities.ts
 */

import { PrismaClient } from "@prisma/client";
import { normalizeSlug } from "../lib/slug";

const prisma = new PrismaClient();

function isLatinSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug);
}

async function main() {
  const cities = await prisma.city.findMany({ orderBy: { name: "asc" } });

  // Group cities by normalized name
  const groups = new Map<string, typeof cities>();
  for (const city of cities) {
    const key = city.name.trim().toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(city);
  }

  let totalDuplicatesRemoved = 0;

  for (const [cityName, group] of groups.entries()) {
    if (group.length <= 1) continue;

    console.log(`\nDuplicate group: "${cityName}" (${group.length} records)`);
    for (const c of group) {
      console.log(`  id=${c.id} slug="${c.slug}"`);
    }

    // Pick canonical: prefer Latin slug, then shortest slug
    const sorted = [...group].sort((a, b) => {
      const aLatin = isLatinSlug(a.slug) ? 0 : 1;
      const bLatin = isLatinSlug(b.slug) ? 0 : 1;
      if (aLatin !== bLatin) return aLatin - bLatin;
      return a.slug.length - b.slug.length;
    });

    const canonical = sorted[0];
    const duplicates = sorted.slice(1);

    console.log(`  -> Canonical: id=${canonical.id} slug="${canonical.slug}"`);
    console.log(`  -> Duplicates to remove: ${duplicates.map((d) => d.id).join(", ")}`);

    await prisma.$transaction(async (tx) => {
      for (const dup of duplicates) {
        // Re-point FnsOffice records
        const fnsCount = await tx.fnsOffice.count({ where: { cityId: dup.id } });
        if (fnsCount > 0) {
          await tx.fnsOffice.updateMany({
            where: { cityId: dup.id },
            data: { cityId: canonical.id },
          });
          console.log(`  Re-pointed ${fnsCount} FnsOffice(s) from ${dup.id} to ${canonical.id}`);
        }

        // Re-point Request records
        const reqCount = await tx.request.count({ where: { cityId: dup.id } });
        if (reqCount > 0) {
          await tx.request.updateMany({
            where: { cityId: dup.id },
            data: { cityId: canonical.id },
          });
          console.log(`  Re-pointed ${reqCount} Request(s) from ${dup.id} to ${canonical.id}`);
        }

        // Delete duplicate city
        await tx.city.delete({ where: { id: dup.id } });
        console.log(`  Deleted city id=${dup.id} slug="${dup.slug}"`);
        totalDuplicatesRemoved++;
      }

      // Normalize canonical slug if it's still Cyrillic
      if (!isLatinSlug(canonical.slug)) {
        const newSlug = normalizeSlug(canonical.slug);
        await tx.city.update({
          where: { id: canonical.id },
          data: { slug: newSlug },
        });
        console.log(`  Normalized slug: "${canonical.slug}" -> "${newSlug}"`);
      }
    });
  }

  // Also normalize all remaining cities that have Cyrillic slugs
  const remaining = await prisma.city.findMany();
  for (const city of remaining) {
    if (!isLatinSlug(city.slug)) {
      const newSlug = normalizeSlug(city.slug);
      console.log(`\nNormalizing slug for city "${city.name}": "${city.slug}" -> "${newSlug}"`);
      try {
        await prisma.city.update({
          where: { id: city.id },
          data: { slug: newSlug },
        });
      } catch (e: unknown) {
        const err = e as { code?: string; message?: string };
        if (err.code === "P2002") {
          console.error(`  Conflict: slug "${newSlug}" already exists. Manual resolution needed.`);
        } else {
          throw e;
        }
      }
    }
  }

  console.log(`\nDone. Removed ${totalDuplicatesRemoved} duplicate city record(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
