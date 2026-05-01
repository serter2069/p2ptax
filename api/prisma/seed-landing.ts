/**
 * seed-landing.ts
 *
 * Fixes the HeroBlock specialist cards so each of the 3 featured specialists
 * shows a DIFFERENT primary service. Also sets Unsplash avatar photos.
 *
 * Safe to re-run (idempotent via upsert / deleteMany + createMany).
 *
 * Run:
 *   doppler run -- npx tsx prisma/seed-landing.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// IDs taken from the live DB (confirmed via /api/specialists/featured)
const SPECIALIST_IDS = {
  yulia:   "0ed05f10-a9f9-4e8d-9f35-a3920e5abaab", // Юлия Зайцева  → Камеральная проверка
  vladimir:"45790a39-0285-48d7-943c-bea399edc3f1", // Владимир Лебедев → ОКК
  svetlana:"ca4f2c0f-491b-4791-bf4c-38f43122a6d1", // Светлана Орлова → Отдел оперативного контроля
  yury:    "5ff5cac2-5bdb-4e52-b82b-10e72ad3e1c3", // Юрий Кондратьев → Выездная проверка
};

// Service IDs from the live local DB
const SERVICE_IDS = {
  vyezdnaya:     "55472950-feb9-4367-9313-514857c7fe5b", // Выездная проверка
  kameral:       "7d4c0783-4a48-4043-8780-017604adaee7", // Камеральная проверка
  okk:           "2a8ccfb7-de80-459d-89eb-936d00b8d851", // Отдел оперативного контроля
};

// Unsplash photos
const AVATARS = {
  yulia:    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop",
  vladimir: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop",
  svetlana: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&h=200&fit=crop",
  yury:     "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
};

async function setOnlyService(specialistId: string, serviceId: string) {
  // Find all specialistFns rows for this specialist
  const fnsEntries = await prisma.specialistFns.findMany({
    where: { specialistId },
    select: { id: true, fnsId: true },
  });

  if (fnsEntries.length === 0) {
    console.warn(`  WARNING: no specialistFns rows for ${specialistId}`);
    return;
  }

  // For each FNS entry: delete all services then insert the target service
  for (const entry of fnsEntries) {
    await prisma.specialistService.deleteMany({
      where: { specialistFnsId: entry.id },
    });

    // Use upsert on the unique constraint [specialistId, fnsId, serviceId]
    await prisma.specialistService.create({
      data: {
        specialistId,
        fnsId: entry.fnsId,
        serviceId,
        specialistFnsId: entry.id,
      },
    });

    console.log(`  FNS ${entry.fnsId}: set service ${serviceId}`);
  }
}

// Verified ex-FNS credentials for the 4 landing specialists. These power the
// green "Ex-ФНС {office} · YYYY-YYYY" badge on cards and trust pillars.
const FNS_CREDS = {
  yulia:    { office: "ИФНС №46 по г. Москве",                          start: 2014, end: 2021, responseMin: 12 },
  vladimir: { office: "ИФНС №7 по г. Москве",                           start: 2008, end: 2020, responseMin: 18 },
  yury:     { office: "Межрайонная ИФНС №39 по Республике Башкортостан", start: 2012, end: 2022, responseMin: 8 },
  svetlana: { office: "ИФНС №25 по г. Москве",                          start: 2015, end: 2023, responseMin: 15 },
} as const;

async function setFnsCredentials(
  userId: string,
  c: { office: string; start: number; end: number; responseMin: number }
) {
  // Profile may not exist for a user — upsert by userId (which is unique).
  await prisma.specialistProfile.upsert({
    where: { userId },
    update: {
      exFnsStartYear: c.start,
      exFnsEndYear: c.end,
      exFnsOffice: c.office,
      verifiedExFns: true,
      cachedAvgResponseMinutes: c.responseMin,
    },
    create: {
      userId,
      exFnsStartYear: c.start,
      exFnsEndYear: c.end,
      exFnsOffice: c.office,
      verifiedExFns: true,
      cachedAvgResponseMinutes: c.responseMin,
    },
  });
}

async function main() {
  console.log("=== seed-landing: fixing featured specialist cards ===");

  // 1. Юлия Зайцева — keep Камеральная as primary (already correct).
  //    Just update avatar.
  await prisma.user.update({
    where: { id: SPECIALIST_IDS.yulia },
    data: { avatarUrl: AVATARS.yulia },
  });
  await setFnsCredentials(SPECIALIST_IDS.yulia, FNS_CREDS.yulia);
  console.log("Юлия Зайцева: avatar + ex-FNS credentials updated");

  // 2. Юрий Кондратьев — set ONLY Выездная проверка + Unsplash avatar
  console.log("Юрий Кондратьев: setting Выездная проверка…");
  await setOnlyService(SPECIALIST_IDS.yury, SERVICE_IDS.vyezdnaya);
  await prisma.user.update({
    where: { id: SPECIALIST_IDS.yury },
    data: { avatarUrl: AVATARS.yury },
  });
  await setFnsCredentials(SPECIALIST_IDS.yury, FNS_CREDS.yury);
  console.log("Юрий Кондратьев: done + ex-FNS credentials");

  // 3. Владимир Лебедев — set ONLY Отдел оперативного контроля
  console.log("Владимир Лебедев: setting Отдел оперативного контроля…");
  await setOnlyService(SPECIALIST_IDS.vladimir, SERVICE_IDS.okk);
  await prisma.user.update({
    where: { id: SPECIALIST_IDS.vladimir },
    data: { avatarUrl: AVATARS.vladimir },
  });
  await setFnsCredentials(SPECIALIST_IDS.vladimir, FNS_CREDS.vladimir);
  console.log("Владимир Лебедев: done + ex-FNS credentials");

  // 4. Светлана Орлова — also set credentials so verified badge surfaces
  //    everywhere her card renders (catalog, search, etc.)
  await prisma.user.update({
    where: { id: SPECIALIST_IDS.svetlana },
    data: { avatarUrl: AVATARS.svetlana },
  });
  await setFnsCredentials(SPECIALIST_IDS.svetlana, FNS_CREDS.svetlana);
  console.log("Светлана Орлова: ex-FNS credentials updated");

  console.log("=== seed-landing complete ===");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
