/**
 * Применяет dadata-fns.json к БД: апсертит FnsOffice + при необходимости
 * заводит City.
 *
 * Адрес у Dadata в формате KLADR-csv:
 *   ",<postcode>,<city> <type>,<district>,<settlement>,<street>,<bld>,<office>,"
 * Примеры:
 *   ",105064,Москва г,,,,Земляной вал ул,9,,"
 *   ",628012,Ханты-Мансийский Автономный округ - Югра ао,,Ханты-Мансийск г,,Дзержинского ул,21,,"
 *
 * Город ищется в позициях с суффиксом "г" — обычно index 2, иначе index 4.
 * Если город не нашёлся — fns маппится на «Регион XX» по первым 2 цифрам кода
 * (создастся служебный city со slug "region-XX").
 *
 * Запуск:
 *   npx tsx prisma/seed-fns-from-dadata.ts
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";

const prisma = new PrismaClient();

interface DadataRecord {
  code: string;
  name: string;
  address: string | null;
  oktmo: string | null;
  parent_code: string | null;
  parent_name: string | null;
}

// Транслитерация для slug (ru → lat).
const TRANSLIT: Record<string, string> = {
  а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",й:"y",
  к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",
  х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya",
};
function slugify(s: string): string {
  return s
    .toLowerCase()
    .split("")
    .map((c) => TRANSLIT[c] ?? c)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Региональные центры по коду региона — fallback, если в адресе нет города.
const REGION_FALLBACK: Record<string, string> = {
  "77": "Москва", "78": "Санкт-Петербург", "50": "Московская область",
  "47": "Ленинградская область", "92": "Севастополь",
};

interface ParsedAddress {
  city: string | null;       // "Москва", "Ханты-Мансийск" — без типа
  postcode: string | null;
}

// Title-case со спец-символами кириллицы (СПб → Спб не нужно — оставляем стоп-лист).
function titleCase(s: string): string {
  if (!s) return s;
  // Если уже не all-caps — оставляем как есть.
  if (s !== s.toUpperCase() && s !== s.toLowerCase()) return s;
  return s
    .toLowerCase()
    .split(/(\s|-)/)
    .map((w) => (w.length > 1 ? w[0].toUpperCase() + w.slice(1) : w))
    .join("");
}

function parseAddress(raw: string): ParsedAddress {
  // KLADR-csv: первые поля — регион/постиндекс/город/...
  const parts = raw.split(",").map((p) => p.trim());
  const postcode = (parts[1] || "").match(/^\d{6}$/)?.[0] ?? null;
  let city: string | null = null;

  // Pass 1: SUFFIX-form — "Москва г", "Донецк г.", "Сириус пгт", "Богатые Сабы с".
  // Принимаем суффиксы: г, г., пгт, пгт., с, с., рп, д., ст-ца, аул.
  const SUFFIX_RE = /^(.+?)\s+(г|г\.|пгт|пгт\.|рп|с|с\.|ст-ца|аул|кп)$/i;
  for (const p of parts) {
    if (!p) continue;
    const m = p.match(SUFFIX_RE);
    if (m) {
      city = m[1].trim();
      break;
    }
  }

  // Pass 2: PREFIX-form — "г. Москва", "г Москва", " Москва" (между запятыми).
  if (!city) {
    for (const p of parts) {
      if (!p) continue;
      const m = p.match(/^(?:г\.?\s+)(.+)$/i);
      if (m) {
        city = m[1].trim();
        break;
      }
    }
  }

  // Нормализация лишних суффиксов и кэпса.
  if (city) {
    city = city.replace(/\s*(г\.?о\.?|муниципальное\s+образование)$/i, "").trim();
    city = titleCase(city);
  }
  return { city, postcode };
}

// Сначала чистим существующие дубли City: «МОСКВА» и «Москва» с разными
// слагами имеют одинаковую сути, надо схлопнуть в один. Берём «лучший»
// (с правильным регистром, наибольшим числом fns) и переносим связи.
async function dedupeCities(): Promise<void> {
  const cities = await prisma.city.findMany({
    select: { id: true, slug: true, name: true },
  });
  // Группируем по нормализованному имени.
  const groups = new Map<string, { id: string; slug: string; name: string }[]>();
  for (const c of cities) {
    const key = c.name.toLowerCase().trim();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }
  for (const [key, group] of groups) {
    if (group.length < 2) continue;
    // Канонический: тот, у кого имя НЕ all-caps (или больше связей).
    const counts = await Promise.all(
      group.map((c) =>
        prisma.fnsOffice.count({ where: { cityId: c.id } }).then((n) => ({ c, n })),
      ),
    );
    counts.sort((a, b) => {
      const aCaps = a.c.name === a.c.name.toUpperCase() ? 1 : 0;
      const bCaps = b.c.name === b.c.name.toUpperCase() ? 1 : 0;
      if (aCaps !== bCaps) return aCaps - bCaps; // not-caps first
      return b.n - a.n; // больше связей — первый
    });
    const winner = counts[0].c;
    const losers = counts.slice(1).map((x) => x.c);
    // Переносим всё с проигравших на победителя.
    for (const loser of losers) {
      await prisma.fnsOffice.updateMany({
        where: { cityId: loser.id },
        data: { cityId: winner.id },
      });
      await prisma.request.updateMany({
        where: { cityId: loser.id },
        data: { cityId: winner.id },
      });
      await prisma.city.delete({ where: { id: loser.id } });
      console.log(`merged "${loser.name}" (${loser.slug}) → "${winner.name}" (${winner.slug})`);
    }
    // Если победитель сам был all-caps — приводим к Title Case.
    if (winner.name === winner.name.toUpperCase()) {
      const fixed = winner.name
        .toLowerCase()
        .split(/(\s|-)/)
        .map((w) => (w.length > 1 ? w[0].toUpperCase() + w.slice(1) : w))
        .join("");
      await prisma.city.update({
        where: { id: winner.id },
        data: { name: fixed },
      });
      console.log(`title-cased "${winner.name}" → "${fixed}"`);
    }
  }
}

async function main() {
  console.log("Phase 1: dedupe existing cities…");
  await dedupeCities();

  const file = "/var/www/p2ptax/api/prisma/data/dadata-fns.json";
  const records: DadataRecord[] = JSON.parse(readFileSync(file, "utf-8"));
  console.log(`Loaded ${records.length} records from ${file}`);

  // Собираем уникальные города из адресов.
  const cityMap = new Map<string, string>(); // name → slug
  for (const r of records) {
    const parsed = r.address ? parseAddress(r.address) : { city: null, postcode: null };
    let cityName = parsed.city;
    if (!cityName) {
      const region = r.code.slice(0, 2);
      cityName = REGION_FALLBACK[region] ?? `Регион ${region}`;
    }
    if (!cityMap.has(cityName)) {
      cityMap.set(cityName, slugify(cityName));
    }
  }
  console.log(`Distinct cities: ${cityMap.size}`);

  // Апсертим города. Сначала ищем по name (на случай если уже есть
  // город с другим slug, например ручной seed), и только затем по slug.
  const cityIds = new Map<string, string>(); // name → id
  for (const [name, slug] of cityMap) {
    const byName = await prisma.city.findFirst({ where: { name } });
    if (byName) {
      cityIds.set(name, byName.id);
      continue;
    }
    const city = await prisma.city.upsert({
      where: { slug },
      update: { name },
      create: { slug, name },
    });
    cityIds.set(name, city.id);
  }
  console.log(`Cities upserted: ${cityIds.size}`);

  // Апсертим FNS.
  let added = 0, updated = 0, skipped = 0;
  for (const r of records) {
    const parsed = r.address ? parseAddress(r.address) : { city: null, postcode: null };
    let cityName = parsed.city;
    if (!cityName) {
      const region = r.code.slice(0, 2);
      cityName = REGION_FALLBACK[region] ?? `Регион ${region}`;
    }
    const cityId = cityIds.get(cityName);
    if (!cityId) {
      skipped++;
      continue;
    }
    // Из KLADR строим читаемый адрес.
    const readableAddr = r.address
      ? r.address.split(",").map((p) => p.trim()).filter(Boolean).join(", ")
      : null;

    const aliases = [
      r.name.toLowerCase(),
      r.code,
      cityName.toLowerCase(),
      "ифнс фнс налоговая инспекция",
    ].join(" ");

    const existed = await prisma.fnsOffice.findUnique({
      where: { code: r.code },
      select: { id: true },
    });
    await prisma.fnsOffice.upsert({
      where: { code: r.code },
      update: {
        name: r.name,
        cityId,
        address: readableAddr,
        searchAliases: aliases,
      },
      create: {
        code: r.code,
        name: r.name,
        cityId,
        address: readableAddr,
        searchAliases: aliases,
      },
    });
    if (existed) updated++;
    else added++;
  }

  const total = await prisma.fnsOffice.count();
  console.log(`Added: ${added}, updated: ${updated}, skipped: ${skipped}, total now: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    prisma.$disconnect();
  });
