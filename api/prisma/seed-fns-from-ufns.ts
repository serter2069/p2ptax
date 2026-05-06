/**
 * Применяет nalog-gov-ufns.json к БД для регионов, где у ИФНС нет
 * собственных страниц (Татарстан, Башкортостан и т.п.). После
 * реорганизации все ИФНС региона работают под единым УФНС, поэтому
 * руководители УФНС применяются как единое руководство ко всем
 * ИФНС региона.
 *
 * Также вычищаем все source='seed' (мог-данные) — оставляем только
 * реальные nalog_gov / nalog_gov_ufns источники.
 *
 * Запуск:
 *   npx tsx prisma/seed-fns-from-ufns.ts
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "fs";

const prisma = new PrismaClient();

interface UfnsBlock {
  department: string;
  chief: string;
}

interface UfnsParsed {
  region: string;
  url: string;
  status: string;
  headOfUfns?: string | null;
  departments: UfnsBlock[];
}

const FILE = "/var/www/p2ptax/api/prisma/data/nalog-gov-ufns.json";

function splitFullName(raw: string): { firstName: string; lastName: string; middleName: string | null } | null {
  const parts = raw.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return null;
  return {
    lastName: parts[0],
    firstName: parts[1],
    middleName: parts[2] ?? null,
  };
}

async function main() {
  if (!existsSync(FILE)) {
    console.error(`No cache at ${FILE} — run scrape-nalog-gov-ufns.ts first`);
    process.exit(1);
  }
  const cache: Record<string, UfnsParsed> = JSON.parse(readFileSync(FILE, "utf-8"));
  const oks = Object.values(cache).filter((r) => r.status === "ok" && r.departments.length > 0);
  console.log(`UFNS records OK: ${oks.length}/${Object.keys(cache).length}`);

  // 1. Чистим ВСЕ seed-сотрудники (Сергей попросил оставить только реальных).
  const removedSeed = await prisma.fnsStaff.deleteMany({ where: { source: "seed" } });
  console.log(`Removed seed staff: ${removedSeed.count}`);

  // 2. Чистим pravatar URL у уже спарсенных nalog_gov — Сергей не хочет
  //    использовать неперсональные portrait-стоки. Без фото = без фото.
  const nullified = await prisma.fnsStaff.updateMany({
    where: { source: "nalog_gov", photoUrl: { contains: "pravatar.cc" } },
    data: { photoUrl: null },
  });
  console.log(`Nullified pravatar photos: ${nullified.count}`);

  // 3. Пробежимся по регионам УФНС и применим к ИФНС, у которых ещё
  //    нет персональных nalog_gov-сотрудников.
  let staffCreated = 0;
  let coveredFns = 0;
  for (const ufns of oks) {
    // Все ИФНС этого региона в БД (по первым 2 цифрам code).
    const regionFns = await prisma.fnsOffice.findMany({
      where: { code: { startsWith: ufns.region } },
      select: { id: true, code: true },
    });
    if (regionFns.length === 0) continue;

    for (const fns of regionFns) {
      // Если уже есть реальные nalog_gov-сотрудники — не трогаем.
      const existing = await prisma.fnsStaff.count({
        where: { fnsId: fns.id, source: "nalog_gov" },
      });
      if (existing > 0) continue;

      // Удаляем старых nalog_gov_ufns (на случай повтора).
      await prisma.fnsStaff.deleteMany({
        where: { fnsId: fns.id, source: "nalog_gov_ufns" },
      });

      // Создаём по одной записи на отдел.
      const entries: Parameters<typeof prisma.fnsStaff.createMany>[0]["data"] = [];
      let order = 0;
      for (const block of ufns.departments) {
        const parsed = splitFullName(block.chief);
        if (!parsed) continue;
        // Парсер УФНС иногда хапает остатки предыдущего отдела
        // («Отдел X Отдел Y»). Берём только последний «Отдел…».
        let dept = block.department;
        const lastIdx = dept.lastIndexOf("Отдел");
        if (lastIdx > 0) dept = dept.slice(lastIdx).trim();
        entries.push({
          fnsId: fns.id,
          firstName: parsed.firstName,
          lastName: parsed.lastName,
          middleName: parsed.middleName,
          position: "Начальник отдела",
          department: dept,
          phone: null,
          email: null,
          photoUrl: null,
          sortOrder: order++,
          source: "nalog_gov_ufns",
        });
      }
      if (entries.length > 0) {
        await prisma.fnsStaff.createMany({ data: entries });
        staffCreated += entries.length;
        coveredFns++;
      }
    }
  }

  console.log(`Done. UFNS-covered FNS: ${coveredFns}, staff created: ${staffCreated}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
