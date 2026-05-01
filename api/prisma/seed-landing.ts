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

// Pin the 4 landing specialists by EMAIL — emails are deterministic from
// seed-specialists.ts, while UUIDs differ between dev DBs and freshly-seeded
// staging DBs. The actual DB id is resolved at runtime via findUnique.
const SPECIALIST_EMAILS = {
  yulia:    "yulia.zaitseva@p2ptax-seed.ru",
  vladimir: "vladimir.lebedev@p2ptax-seed.ru",
  svetlana: "svetlana.orlova@p2ptax-seed.ru",
  yury:     "yuriy.kondratyev@p2ptax-seed.ru",
} as const;

// AI-generated portraits served via the MinIO proxy at api/src/index.ts.
// Source files in `assets/images/specialists/`; uploaded by
// `seed-landing-avatars.ts` (run that AFTER this script if avatars are wiped).
const apiBase = process.env.PUBLIC_API_URL || "http://localhost:3812";
const minioBucket = process.env.MINIO_BUCKET || process.env.HETZNER_S3_BUCKET || "p2ptax";
const AVATARS = {
  yulia:    `${apiBase}/${minioBucket}/landing/yulia.jpg`,
  vladimir: `${apiBase}/${minioBucket}/landing/vladimir.jpg`,
  svetlana: `${apiBase}/${minioBucket}/landing/svetlana.jpg`,
  yury:     `${apiBase}/${minioBucket}/landing/yury.jpg`,
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

async function resolveIdByEmail(email: string): Promise<string | null> {
  const u = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!u) {
    console.warn(`  WARN: no user with email=${email} (skipping)`);
    return null;
  }
  return u.id;
}

// Lookup the canonical service id by name (set in seed.ts).
async function resolveServiceId(name: string): Promise<string | null> {
  const s = await prisma.service.findFirst({ where: { name }, select: { id: true } });
  if (!s) {
    console.warn(`  WARN: no service named "${name}"`);
    return null;
  }
  return s.id;
}

async function main() {
  console.log("=== seed-landing: fixing featured specialist cards ===");

  const yuliaId    = await resolveIdByEmail(SPECIALIST_EMAILS.yulia);
  const vladimirId = await resolveIdByEmail(SPECIALIST_EMAILS.vladimir);
  const yuryId     = await resolveIdByEmail(SPECIALIST_EMAILS.yury);
  const svetlanaId = await resolveIdByEmail(SPECIALIST_EMAILS.svetlana);

  const vyezdnayaSvc = await resolveServiceId("Выездная проверка");
  const okkSvc       = await resolveServiceId("Отдел оперативного контроля");

  // 1. Юлия — Камеральная (default from seed-specialists), avatar + creds
  if (yuliaId) {
    await prisma.user.update({ where: { id: yuliaId }, data: { avatarUrl: AVATARS.yulia } });
    await setFnsCredentials(yuliaId, FNS_CREDS.yulia);
    console.log("Юлия Зайцева: avatar + ex-FNS credentials updated");
  }

  // 2. Юрий → Выездная
  if (yuryId && vyezdnayaSvc) {
    await setOnlyService(yuryId, vyezdnayaSvc);
    await prisma.user.update({ where: { id: yuryId }, data: { avatarUrl: AVATARS.yury } });
    await setFnsCredentials(yuryId, FNS_CREDS.yury);
    console.log("Юрий Кондратьев: Выездная + avatar + ex-FNS credentials");
  }

  // 3. Владимир → ОКК
  if (vladimirId && okkSvc) {
    await setOnlyService(vladimirId, okkSvc);
    await prisma.user.update({ where: { id: vladimirId }, data: { avatarUrl: AVATARS.vladimir } });
    await setFnsCredentials(vladimirId, FNS_CREDS.vladimir);
    console.log("Владимир Лебедев: ОКК + avatar + ex-FNS credentials");
  }

  // 4. Светлана — keep her existing service from seed-specialists, set creds
  if (svetlanaId) {
    await prisma.user.update({ where: { id: svetlanaId }, data: { avatarUrl: AVATARS.svetlana } });
    await setFnsCredentials(svetlanaId, FNS_CREDS.svetlana);
    console.log("Светлана Орлова: avatar + ex-FNS credentials");
  }

  console.log("=== seed-landing complete ===");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
