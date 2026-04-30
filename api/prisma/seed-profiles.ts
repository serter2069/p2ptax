/**
 * seed-profiles.ts
 *
 * Sets isAvailable for the first 5 specialists in the DB:
 *   - 2 → isAvailable = false (closed)
 *   - 3 → isAvailable = true  (open)
 *
 * Safe to re-run (idempotent upsert via update).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Fetch first 5 specialists ordered by createdAt
  const specialists = await prisma.user.findMany({
    where: { isSpecialist: true },
    orderBy: { createdAt: "asc" },
    take: 5,
    select: { id: true, firstName: true, lastName: true, isAvailable: true },
  });

  if (specialists.length === 0) {
    console.log("No specialists found. Run seed-specialists.ts first.");
    return;
  }

  console.log(`Found ${specialists.length} specialists. Updating availability...`);

  for (let i = 0; i < specialists.length; i++) {
    const s = specialists[i];
    const isAvailable = i >= 2; // first 2 closed, rest open
    await prisma.user.update({
      where: { id: s.id },
      data: { isAvailable },
    });
    console.log(
      `  [${i + 1}] ${s.firstName ?? ""} ${s.lastName ?? ""} → isAvailable=${isAvailable}`
    );
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
