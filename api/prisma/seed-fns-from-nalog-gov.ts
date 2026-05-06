/**
 * Применяет nalog-gov-fns.json к БД: для всех ИФНС со status=ok
 *   - заменяет seed-сотрудников реальными ФИО (source='nalog_gov')
 *   - сохраняет фото инспекции в photoUrls
 *   - сохраняет ссылку на оригинал в nalogGovUrl
 *
 * Идемпотентно: при повторном прогоне удаляются записи только с
 * source='nalog_gov', потом пересоздаются. Seed-сотрудников не
 * трогаем — они остаются для ИФНС, по которым реальных данных нет.
 *
 * Запуск:
 *   npx tsx prisma/seed-fns-from-nalog-gov.ts
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "fs";

const prisma = new PrismaClient();

interface Department {
  name: string;
  head: string | null;
}

interface FnsParsed {
  code: string;
  url: string;
  status: string;
  chiefName?: string | null;
  deputyNames?: string[];
  departments?: Department[];
  photoUrls?: string[];
}

const FILE = "/var/www/p2ptax/api/prisma/data/nalog-gov-fns.json";

// Pravatar — отбор «деловых» аватарок (как в seed-fns-meta.ts).
const PRAVATAR_M = [12, 13, 14, 15, 17, 18, 27, 33, 51, 52, 53, 56, 57, 58, 60, 67, 68, 69];
const PRAVATAR_F = [5, 9, 10, 16, 19, 20, 23, 25, 32, 34, 36, 41, 44, 45, 47, 49];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function isFemaleName(firstName: string): boolean {
  // Большинство русских женских имён оканчиваются на -а/-я.
  return /[ая]$/i.test(firstName);
}

function avatarUrl(firstName: string, seed: string): string {
  const female = isFemaleName(firstName);
  const pool = female ? PRAVATAR_F : PRAVATAR_M;
  return `https://i.pravatar.cc/300?img=${pool[hash(seed) % pool.length]}`;
}

// Раскладываем «Иванов Иван Иванович» в части. И. О./И.о. — снимаем.
function splitFullName(raw: string): { firstName: string; lastName: string; middleName: string | null; isActing: boolean } | null {
  let s = raw.trim();
  let isActing = false;
  // Префиксы И. О. / И.о. начальника / И. о. начальника отдела:
  const m = s.match(/^[Ии]\.?\s*[Оо]\.?\s*(?:начальник[аио]?\s*(?:отдела)?\s*[:\s]*)?(.+)$/);
  if (m) {
    isActing = true;
    s = m[1].trim();
  }
  // Иногда "и.о. начальника отдела: ФИО"
  s = s.replace(/^начальник[аио]?\s*(?:отдела)?\s*[:\s]+/i, "");
  s = s.trim();
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return null;
  return {
    lastName: parts[0],
    firstName: parts[1],
    middleName: parts[2] ?? null,
    isActing,
  };
}

// Из dept name делаем читаемую должность.
// "Отдел камеральных проверок №3" → "Начальник отдела камеральных проверок №3"
function positionFromDept(dept: string): string {
  if (/^(Руководство|Отдел оказания государственных услуг)$/i.test(dept)) {
    return "Начальник инспекции";
  }
  return `Начальник ${dept.toLowerCase()}`;
}

async function main() {
  if (!existsSync(FILE)) {
    console.error(`No cache file at ${FILE} — run scrape-nalog-gov.ts first`);
    process.exit(1);
  }
  const cache: Record<string, FnsParsed> = JSON.parse(readFileSync(FILE, "utf-8"));
  const oks = Object.values(cache).filter((v) => v.status === "ok");
  console.log(`Loaded ${oks.length} OK records out of ${Object.keys(cache).length}`);

  let updatedFns = 0;
  let staffCreated = 0;
  let skipped = 0;

  for (const r of oks) {
    const fns = await prisma.fnsOffice.findUnique({
      where: { code: r.code },
      select: { id: true },
    });
    if (!fns) {
      skipped++;
      continue;
    }

    // 1. Обновляем мета-поля.
    await prisma.fnsOffice.update({
      where: { id: fns.id },
      data: {
        photoUrls: r.photoUrls ?? [],
        nalogGovUrl: r.url,
      },
    });
    updatedFns++;

    // 2. Удаляем старые сидовые + nalog_gov записи (на случай повтора).
    await prisma.fnsStaff.deleteMany({
      where: { fnsId: fns.id, source: { in: ["seed", "nalog_gov"] } },
    });

    // 3. Cоздаём начальника инспекции.
    const entries: Parameters<typeof prisma.fnsStaff.createMany>[0]["data"] = [];
    let order = 0;

    if (r.chiefName) {
      const parsed = splitFullName(r.chiefName);
      if (parsed) {
        const fullSeed = `${r.code}-chief-${parsed.lastName}-${parsed.firstName}`;
        entries.push({
          fnsId: fns.id,
          firstName: parsed.firstName,
          lastName: parsed.lastName,
          middleName: parsed.middleName,
          position: parsed.isActing
            ? "И. о. начальника инспекции"
            : "Начальник инспекции",
          department: "Руководство",
          phone: null, // на сайте ФНС телефонов конкретного начальника обычно нет
          email: `${r.code}.chief@nalog.gov.ru`,
          photoUrl: avatarUrl(parsed.firstName, fullSeed),
          sortOrder: order++,
          source: "nalog_gov",
        });
      }
    }

    // 4. Замы.
    for (const dep of r.deputyNames ?? []) {
      const parsed = splitFullName(dep);
      if (!parsed) continue;
      const fullSeed = `${r.code}-dep-${parsed.lastName}-${parsed.firstName}`;
      entries.push({
        fnsId: fns.id,
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        middleName: parsed.middleName,
        position: "Заместитель начальника инспекции",
        department: "Руководство",
        phone: null,
        email: `${r.code}.${order + 1}@nalog.gov.ru`,
        photoUrl: avatarUrl(parsed.firstName, fullSeed),
        sortOrder: order++,
        source: "nalog_gov",
      });
    }

    // 5. Начальники отделов.
    for (const d of r.departments ?? []) {
      if (!d.head) continue;
      const parsed = splitFullName(d.head);
      if (!parsed) continue;
      const fullSeed = `${r.code}-${d.name}-${parsed.lastName}`;
      // Если в department имя «Отдел оказания государственных услуг» и
      // ФИО совпадает с chief — это уже учтено как начальник, скип.
      const isSameAsChief =
        r.chiefName &&
        r.chiefName.includes(parsed.lastName) &&
        r.chiefName.includes(parsed.firstName);
      if (isSameAsChief && d.name.toLowerCase().includes("оказания государственных услуг")) {
        continue;
      }
      entries.push({
        fnsId: fns.id,
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        middleName: parsed.middleName,
        position: parsed.isActing
          ? `И. о. начальника ${d.name.toLowerCase()}`
          : positionFromDept(d.name),
        department: d.name,
        phone: null,
        email: `${r.code}.${order + 1}@nalog.gov.ru`,
        photoUrl: avatarUrl(parsed.firstName, fullSeed),
        sortOrder: order++,
        source: "nalog_gov",
      });
    }

    if (entries.length > 0) {
      await prisma.fnsStaff.createMany({ data: entries });
      staffCreated += entries.length;
    }
  }

  console.log(`Done. Updated FNS: ${updatedFns}, staff created: ${staffCreated}, skipped: ${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
