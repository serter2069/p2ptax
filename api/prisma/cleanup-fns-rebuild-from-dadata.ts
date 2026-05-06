/**
 * Полная пересборка справочника ИФНС от Dadata.
 *
 * Текущее состояние БД:
 *   527 fns_offices = 390 совпадают с Dadata + 87 УФНС (XX00) +
 *   137 фейковых территориальных без подтверждения у Dadata.
 *   К 137 привязано: 44 specialist_fns, 17 requests, 1 vip-подписка,
 *   плюс синтетические 530 fns_reviews + 3543 fns_staff + 9027 staff
 *   reviews.
 *
 * Что делаем:
 *   1. Полностью wipe-аем синтетику: fns_staff_reviews, fns_staff,
 *      fns_reviews — данные были seed-овые, доверять им смысла нет.
 *   2. Для 137 фейков — мигрируем привязки (specialist_fns / requests
 *      / vip) на ближайший реальный Dadata-код в том же регионе. Если
 *      миграция невозможна (нет ни одной реальной ИФНС в регионе) —
 *      сохраняем в orphans.json для ручного разбора.
 *   3. Удаляем 137 фейковых ИФНС.
 *   4. Для оставшихся 390 — апдейтим name/address/oktmo из Dadata
 *      (canonical source).
 *   5. Чистим yandex_org_id/rating/etc — старые привязки больше не
 *      гарантированы корректными.
 *
 * УФНС (XX00) не трогаем — они не покрываются Dadata, у них своя
 * сверка через nalog.gov.ru/about_fts.
 *
 * Запуск:
 *   npx tsx prisma/cleanup-fns-rebuild-from-dadata.ts --dry-run
 *   npx tsx prisma/cleanup-fns-rebuild-from-dadata.ts --apply
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync, writeFileSync } from "fs";

const prisma = new PrismaClient();

const DRY_RUN = !process.argv.includes("--apply");
const DADATA_FILE = "/var/www/p2ptax/api/prisma/data/dadata-fns.json";
const ORPHANS_FILE = "/tmp/p2ptax-fns-rebuild-orphans.json";

interface DadataRecord {
  code: string;
  name: string;
  address: string | null;
  oktmo: string | null;
}

interface DbFns {
  id: string;
  code: string;
  name: string;
  cityId: string;
}

function isUfns(code: string): boolean {
  return /^\d{2}00$/.test(code);
}
function isMri9(code: string): boolean {
  return code.startsWith("9");
}

// Ближайшая реальная ИФНС в том же регионе. Стратегия:
//   1. По возможности сохраним «номер инспекции» (число в имени) — найдём
//      Dadata с тем же номером в регионе.
//   2. Иначе — первая Dadata-ИФНС региона.
function pickClosest(
  fakeFns: DbFns,
  dadataInRegion: DadataRecord[],
): DadataRecord | null {
  if (dadataInRegion.length === 0) return null;
  const num = fakeFns.name.match(/№\s*(\d+)/)?.[1];
  if (num) {
    const same = dadataInRegion.find((d) => d.name.includes(`№ ${num}`) || d.name.includes(`№${num}`));
    if (same) return same;
  }
  return dadataInRegion[0];
}

async function main() {
  console.log(DRY_RUN ? "=== DRY RUN ===" : "=== APPLY MODE ===");

  // 1. Грузим Dadata.
  const dadata: DadataRecord[] = JSON.parse(readFileSync(DADATA_FILE, "utf-8"));
  const dadataMap = new Map(dadata.map((d) => [d.code, d]));
  console.log(`Dadata records: ${dadata.length}`);

  // 2. Грузим текущие ИФНС.
  const dbFns = await prisma.fnsOffice.findMany({
    select: { id: true, code: true, name: true, cityId: true },
    orderBy: { code: "asc" },
  });
  console.log(`DB fns_offices: ${dbFns.length}`);

  const fakeFns = dbFns.filter(
    (f) => !dadataMap.has(f.code) && !isUfns(f.code) && !isMri9(f.code),
  );
  const realFns = dbFns.filter((f) => dadataMap.has(f.code));
  const ufnsRows = dbFns.filter((f) => isUfns(f.code));
  console.log(`  → real (in Dadata): ${realFns.length}`);
  console.log(`  → УФНС (XX00, не трогаем): ${ufnsRows.length}`);
  console.log(`  → fake/old (удаляем): ${fakeFns.length}`);

  // 3. Готовим план миграций.
  const dadataByRegion = new Map<string, DadataRecord[]>();
  for (const d of dadata) {
    const r = d.code.slice(0, 2);
    if (!dadataByRegion.has(r)) dadataByRegion.set(r, []);
    dadataByRegion.get(r)!.push(d);
  }

  // map fake fns_id → closest real fns_id (после переноса)
  const migrationMap = new Map<string, { toCode: string; toName: string }>();
  const orphans: Array<{ fakeCode: string; fakeName: string; reason: string }> = [];

  for (const f of fakeFns) {
    const region = f.code.slice(0, 2);
    const closest = pickClosest(f, dadataByRegion.get(region) ?? []);
    if (!closest) {
      orphans.push({
        fakeCode: f.code,
        fakeName: f.name,
        reason: `no Dadata records in region ${region}`,
      });
      continue;
    }
    migrationMap.set(f.id, { toCode: closest.code, toName: closest.name });
  }

  console.log(`\nМиграция: ${migrationMap.size} фейков → реальные коды.`);
  console.log(`Сироты: ${orphans.length}`);

  if (orphans.length > 0) {
    writeFileSync(ORPHANS_FILE, JSON.stringify(orphans, null, 2));
    console.log(`  → ${ORPHANS_FILE}`);
  }

  // 4. Считаем что зависит от каждого fake fns.
  const fakeIds = fakeFns.map((f) => f.id);
  const [specialistsLinks, requestsLinks, vipLinks, reviewsCount, staffCount, staffReviewsCount] =
    await Promise.all([
      prisma.specialistFns.count({ where: { fnsId: { in: fakeIds } } }),
      prisma.request.count({ where: { fnsId: { in: fakeIds } } }),
      prisma.specialistVipFns.count({ where: { fnsId: { in: fakeIds } } }),
      prisma.fnsReview.count(),
      prisma.fnsStaff.count(),
      prisma.fnsStaffReview.count(),
    ]);

  console.log(`\nЗависимости от 137 фейков:`);
  console.log(`  specialist_fns:      ${specialistsLinks}`);
  console.log(`  requests:            ${requestsLinks}`);
  console.log(`  specialist_vip_fns:  ${vipLinks}`);
  console.log(`\nСинтетика (wipe всех):`);
  console.log(`  fns_reviews:       ${reviewsCount}`);
  console.log(`  fns_staff:         ${staffCount}`);
  console.log(`  fns_staff_reviews: ${staffReviewsCount}`);

  if (DRY_RUN) {
    console.log("\n=== DRY RUN — изменения НЕ применены ===");
    console.log("Запустите с --apply для реального выполнения.");
    return;
  }

  // 5. ===== APPLY =====
  console.log("\n=== APPLYING ===");

  // 5a. Wipe синтетики.
  console.log("Wipe synthetic data…");
  const delStaffReviews = await prisma.fnsStaffReview.deleteMany({});
  const delStaff = await prisma.fnsStaff.deleteMany({});
  const delReviews = await prisma.fnsReview.deleteMany({});
  console.log(`  staff_reviews: ${delStaffReviews.count}`);
  console.log(`  staff: ${delStaff.count}`);
  console.log(`  reviews: ${delReviews.count}`);

  // 5b. Миграция привязок.
  console.log("\nМиграция specialist_fns / requests / vip…");
  let migSf = 0, migReq = 0, migVip = 0, dedupSf = 0, dedupVip = 0;

  for (const [fakeId, target] of migrationMap) {
    const targetFns = await prisma.fnsOffice.findUnique({
      where: { code: target.toCode },
      select: { id: true },
    });
    if (!targetFns) continue;

    // specialist_fns: проверим уникальность (specialistId+fnsId)
    const sfRows = await prisma.specialistFns.findMany({
      where: { fnsId: fakeId },
      select: { id: true, specialistId: true },
    });
    for (const sf of sfRows) {
      const dup = await prisma.specialistFns.findFirst({
        where: { specialistId: sf.specialistId, fnsId: targetFns.id },
        select: { id: true },
      });
      if (dup) {
        // Уже есть линк → удаляем фейковый.
        await prisma.specialistFns.delete({ where: { id: sf.id } });
        dedupSf++;
      } else {
        await prisma.specialistFns.update({ where: { id: sf.id }, data: { fnsId: targetFns.id } });
        migSf++;
      }
    }

    // requests — переносим (нет уникального констрейнта, просто UPDATE)
    const r = await prisma.request.updateMany({
      where: { fnsId: fakeId },
      data: { fnsId: targetFns.id },
    });
    migReq += r.count;

    // specialist_vip_fns: уникальность (specialistId+fnsId)
    const vipRows = await prisma.specialistVipFns.findMany({
      where: { fnsId: fakeId },
      select: { id: true, specialistId: true },
    });
    for (const v of vipRows) {
      const dup = await prisma.specialistVipFns.findFirst({
        where: { specialistId: v.specialistId, fnsId: targetFns.id },
        select: { id: true },
      });
      if (dup) {
        await prisma.specialistVipFns.delete({ where: { id: v.id } });
        dedupVip++;
      } else {
        await prisma.specialistVipFns.update({ where: { id: v.id }, data: { fnsId: targetFns.id } });
        migVip++;
      }
    }
  }
  console.log(`  specialist_fns: migrated=${migSf} dedup=${dedupSf}`);
  console.log(`  requests:       migrated=${migReq}`);
  console.log(`  vip:            migrated=${migVip} dedup=${dedupVip}`);

  // 5c. Удаляем оставшиеся специалистские/реквест-связки на сиротские fns
  // (для тех, кому не нашёлся target — оставляем requests на месте, но
  // удаляем specialist_fns/vip как пользовательский шум).
  if (orphans.length > 0) {
    const orphanCodes = orphans.map((o) => o.fakeCode);
    const orphanFns = await prisma.fnsOffice.findMany({
      where: { code: { in: orphanCodes } },
      select: { id: true, code: true },
    });
    const orphanIds = orphanFns.map((f) => f.id);
    const delOrphanSf = await prisma.specialistFns.deleteMany({ where: { fnsId: { in: orphanIds } } });
    const delOrphanVip = await prisma.specialistVipFns.deleteMany({ where: { fnsId: { in: orphanIds } } });
    console.log(`  orphan cleanup: specialist_fns=${delOrphanSf.count} vip=${delOrphanVip.count}`);
  }

  // 5d. Удаляем фейковые fns_offices (где безопасно — нет requests/etc).
  console.log("\nDelete fake fns_offices…");
  let deleted = 0, skippedByRequests = 0;
  for (const f of fakeFns) {
    const reqLeft = await prisma.request.count({ where: { fnsId: f.id } });
    if (reqLeft > 0) {
      // Не должно случиться после миграции, но perehiljatic safeguard.
      console.log(`  skip ${f.code}: ${reqLeft} requests still attached`);
      skippedByRequests++;
      continue;
    }
    await prisma.fnsOffice.delete({ where: { id: f.id } });
    deleted++;
  }
  console.log(`  deleted: ${deleted}, skipped (requests still attached): ${skippedByRequests}`);

  // 5e. Refresh оставшихся 390 из Dadata: name + oktmo + clear yandex_*
  console.log("\nRefresh 390 verified ИФНС из Dadata…");
  let refreshed = 0;
  for (const f of realFns) {
    const d = dadataMap.get(f.code)!;
    await prisma.fnsOffice.update({
      where: { id: f.id },
      data: {
        name: d.name,
        oktmo: d.oktmo ?? null,
        // address уже синхронен, не трогаем
        // yandex_* очищаем — старые привязки могут не соответствовать
        yandexOrgId: null,
        yandexOrgUrl: null,
        yandexRating: null,
        yandexReviewsCount: null,
        yandexUpdatedAt: null,
      },
    });
    refreshed++;
  }
  console.log(`  refreshed: ${refreshed}`);

  console.log("\n✓ Готово.");
  const finalCount = await prisma.fnsOffice.count();
  console.log(`Финальный fns_offices: ${finalCount} (было 527, ожидаем 390 + 87 УФНС = 477)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
