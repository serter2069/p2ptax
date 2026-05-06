/**
 * Парсер subdivisions страницы УФНС каждого региона:
 *   https://www.nalog.gov.ru/rn{XX}/about_fts/structure/subdivisions/
 *
 * Для регионов где у ИФНС нет отдельных страниц (Татарстан,
 * Башкортостан и т.п.) это единственный источник реальных ФИО.
 * После реорганизации 2022-2024 все региональные инспекции
 * фактически работают под единым УФНС, у них общее руководство.
 *
 * Кэшируем в prisma/data/nalog-gov-ufns.json. Запуск:
 *   npx tsx prisma/scrape-nalog-gov-ufns.ts
 */

import { PrismaClient } from "@prisma/client";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { dirname } from "path";

const prisma = new PrismaClient();
const OUT_FILE = "/var/www/p2ptax/api/prisma/data/nalog-gov-ufns.json";

interface UfnsBlock {
  department: string;
  chief: string;
}

interface UfnsParsed {
  region: string;
  url: string;
  status: "ok" | "error";
  errorMessage?: string;
  // ФИО руководителя УФНС, если найдено отдельно.
  headOfUfns?: string | null;
  // Все «отдел → начальник» с страницы.
  departments: UfnsBlock[];
  fetchedAt: string;
}

let lastReqMs = 0;
async function rateLimit(): Promise<void> {
  const now = Date.now();
  const wait = lastReqMs + 500 - now;
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastReqMs = Date.now();
}

async function fetchPage(url: string): Promise<{ html: string; status: number }> {
  await rateLimit();
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "ru-RU,ru;q=0.9",
    },
    redirect: "follow",
  });
  return { html: await res.text(), status: res.status };
}

function parseSubdivisions(html: string): UfnsParsed["departments"] {
  let s = html;
  s = s.replace(/<script[^>]*>[\s\S]*?<\/script>/g, "");
  s = s.replace(/<style[^>]*>[\s\S]*?<\/style>/g, "");
  s = s.replace(/<[^>]+>/g, " ");
  s = s.replace(/\s+/g, " ");
  // Якорь «↑ К началу страницы Начальник:» — это конец карточки отдела.
  // Перед стрелкой идёт название отдела (с возможным мусором от
  // предыдущей карточки), после ФИО — начальник.
  const re = /(Отдел[^↑]{2,400}?)\s*↑\s*К\s+началу\s+страницы\s*Начальник:\s+([А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+)/g;
  const out: UfnsBlock[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    let dept = m[1].trim();
    // Берём только ПОСЛЕДНИЙ "Отдел..." в строке — захватом могло
    // зацепить хвост от предыдущей карточки («…отдела. Отдел Х»).
    const lastIdx = dept.lastIndexOf("Отдел");
    if (lastIdx > 0) dept = dept.slice(lastIdx);
    // Чистим точку «...отдела.» и trailing пробелы.
    dept = dept.replace(/\s+$/, "").replace(/\.$/, "").trim();
    const chief = m[2].trim();
    const key = chief; // дедуп по ФИО
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ department: dept, chief });
  }
  return out;
}

function parseHeadOfUfns(html: string): string | null {
  // На странице головы УФНС: /rn{XX}/about_fts/structure/head/
  // Здесь упрощённо — ищем «Руководитель УФНС» с ФИО.
  const m = html.match(/Руководитель[^<]*?<\/[^>]+>\s*<[^>]+>([А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+)/);
  return m?.[1]?.trim() ?? null;
}

async function scrapeRegion(region: string): Promise<UfnsParsed> {
  const url = `https://www.nalog.gov.ru/rn${region}/about_fts/structure/subdivisions/`;
  try {
    const { html, status } = await fetchPage(url);
    if (status >= 400) {
      return {
        region, url, status: "error",
        errorMessage: `HTTP ${status}`,
        departments: [],
        fetchedAt: new Date().toISOString(),
      };
    }
    const departments = parseSubdivisions(html);
    const headOfUfns = parseHeadOfUfns(html);
    return {
      region, url, status: "ok",
      headOfUfns,
      departments,
      fetchedAt: new Date().toISOString(),
    };
  } catch (e) {
    return {
      region, url, status: "error",
      errorMessage: (e as Error).message,
      departments: [],
      fetchedAt: new Date().toISOString(),
    };
  }
}

async function main() {
  // Уникальные регион-коды из БД (первые 2 цифры).
  const fns = await prisma.fnsOffice.findMany({ select: { code: true } });
  const regions = [...new Set(fns.map((f) => f.code.slice(0, 2)))].sort();
  console.log(`Regions: ${regions.length}`);

  let cache: Record<string, UfnsParsed> = {};
  if (existsSync(OUT_FILE)) {
    try { cache = JSON.parse(readFileSync(OUT_FILE, "utf-8")); } catch { /* ignore */ }
  }

  let ok = 0, err = 0;
  let i = 0;
  for (const region of regions) {
    if (cache[region]?.status === "ok") {
      ok++;
      continue;
    }
    const result = await scrapeRegion(region);
    cache[region] = result;
    if (result.status === "ok") ok++; else err++;
    i++;
    if (i % 10 === 0 || i === regions.length) {
      mkdirSync(dirname(OUT_FILE), { recursive: true });
      writeFileSync(OUT_FILE, JSON.stringify(cache, null, 2));
      console.log(`  ${i}/${regions.length} (ok=${ok} err=${err})`);
    }
  }

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(cache, null, 2));
  // Статистика: сколько отделов спарсилось.
  const total = Object.values(cache).reduce((s, r) => s + r.departments.length, 0);
  console.log(`Done. Regions OK: ${ok}, errors: ${err}, total departments parsed: ${total}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
