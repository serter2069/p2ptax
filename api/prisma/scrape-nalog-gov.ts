/**
 * Парсер сайта ФНС России для каждой ИФНС.
 * URL-схема: https://www.nalog.gov.ru/rn{XX}/ifns/imns{XX}_{YY}/
 *   где XX = первые 2 цифры кода, YY = последние 2 цифры.
 *
 * Извлекаем:
 *   - ФИО руководителя (из секции «Руководство → Начальник»)
 *   - Список отделов и их начальников (info-block_list)
 *   - URL фотографий ИФНС из data.nalog.ru/cdn/image/
 *
 * Кэшируем результат в prisma/data/nalog-gov-fns.json. Если запись
 * уже есть — пропускаем (rerun только новые/недостающие ИФНС). С
 * --force перезаписываем все.
 *
 * Запуск:
 *   npx tsx prisma/scrape-nalog-gov.ts
 *   npx tsx prisma/scrape-nalog-gov.ts --force
 */

import { PrismaClient } from "@prisma/client";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { dirname } from "path";

const prisma = new PrismaClient();

const FORCE = process.argv.includes("--force");
const OUT_FILE = "/var/www/p2ptax/api/prisma/data/nalog-gov-fns.json";

interface DepartmentParsed {
  name: string;
  head: string | null;
}

interface FnsParsed {
  code: string;
  url: string;
  status: "ok" | "404" | "noSuchSchema" | "error" | "skip";
  errorMessage?: string;
  chiefName?: string | null;       // Начальник инспекции
  deputyNames?: string[];           // Замы (если найдём)
  departments?: DepartmentParsed[];
  photoUrls?: string[];             // фото на data.nalog.ru/cdn
  fetchedAt: string;
}

let lastReqMs = 0;
async function rateLimit(): Promise<void> {
  // Сайт ФНС — не очень шустрый. Едем 2 r/s, чтобы не словить тротл.
  const now = Date.now();
  const wait = lastReqMs + 500 - now;
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastReqMs = Date.now();
}

function urlFor(code: string): string {
  const region = code.slice(0, 2);
  const office = code.slice(2);
  return `https://www.nalog.gov.ru/rn${region}/ifns/imns${region}_${office}/`;
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
  const html = await res.text();
  return { html, status: res.status };
}

// === Парсинг ===
// Структура HTML страницы ФНС (info-block_list):
//   <h6>Название отдела</h6>
//   <div class="data-block__row">
//     <div class="data-block__name">Начальник:</div>
//     <div class="data-block__data">ФИО</div>
//   </div>

function parseBlocks(html: string): DepartmentParsed[] {
  const out: DepartmentParsed[] = [];
  // Грубый regexp на info-block_list — каждое попадание = отдел.
  const blockRe = /<div class="info-block info-block_list js-list">([\s\S]*?)<\/div>\s*<!-- \/info-block_list -->/g;
  let match: RegExpExecArray | null;
  while ((match = blockRe.exec(html)) !== null) {
    const block = match[1];
    const titleM = block.match(/<h6>([^<]+)<\/h6>/);
    if (!titleM) continue;
    const name = titleM[1].trim();
    if (!name || name.toLowerCase() === "контакты") continue;
    // Найти «Начальник: ФИО»
    const headM = block.match(
      /<div class="data-block__name">\s*Начальник:\s*<\/div>\s*<div class="data-block__data">([^<]+)</,
    );
    const head = headM?.[1]?.trim() || null;
    if (head) out.push({ name, head });
  }
  return out;
}

function parseChief(html: string): { chief: string | null; deputies: string[] } {
  // Руководство — обычно первый info-block с заголовком «Руководство» или
  // прямо в data-block. Берём первый «Начальник:» в HTML — это начальник.
  const chiefM = html.match(
    /<div class="data-block__name">\s*Начальник:\s*<\/div>\s*<div class="data-block__data">([^<]+)</,
  );
  const chief = chiefM?.[1]?.trim() || null;

  // Замы — отдельный паттерн, но они часто на той же странице.
  const deputies: string[] = [];
  const depRe = /Заместитель\s+начальника[^<]*<\/div>\s*<div class="data-block__data">([^<]+)</g;
  let m: RegExpExecArray | null;
  while ((m = depRe.exec(html)) !== null) {
    const name = m[1].trim();
    if (name) deputies.push(name);
  }
  return { chief, deputies };
}

function parsePhotos(html: string): string[] {
  const out = new Set<string>();
  const re = /src="(https:\/\/data\.nalog\.ru\/cdn\/image\/[^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) out.add(m[1]);
  return [...out];
}

async function scrapeOne(code: string): Promise<FnsParsed> {
  const url = urlFor(code);
  // Пропускаем УФНС (XX00) и МРИ (9XXX) — у них своя структура,
  // которая не парсится этим скриптом.
  if (code.endsWith("00") || code.startsWith("9")) {
    return { code, url, status: "skip", fetchedAt: new Date().toISOString() };
  }
  try {
    const { html, status } = await fetchPage(url);
    if (status === 404) {
      return { code, url, status: "404", fetchedAt: new Date().toISOString() };
    }
    if (status >= 400) {
      return {
        code, url, status: "error",
        errorMessage: `HTTP ${status}`,
        fetchedAt: new Date().toISOString(),
      };
    }
    // Иногда ФНС отдаёт 200 + страница «not_found» — детектируем.
    if (/not_found/.test(html) || /<title>[^<]*404/.test(html)) {
      return { code, url, status: "404", fetchedAt: new Date().toISOString() };
    }
    if (!/data-block/.test(html)) {
      return {
        code, url, status: "noSuchSchema",
        errorMessage: "no data-block markup",
        fetchedAt: new Date().toISOString(),
      };
    }
    const { chief, deputies } = parseChief(html);
    const departments = parseBlocks(html);
    const photoUrls = parsePhotos(html);
    return {
      code, url, status: "ok",
      chiefName: chief,
      deputyNames: deputies,
      departments,
      photoUrls,
      fetchedAt: new Date().toISOString(),
    };
  } catch (e) {
    return {
      code, url, status: "error",
      errorMessage: (e as Error).message,
      fetchedAt: new Date().toISOString(),
    };
  }
}

async function main() {
  // Существующий кэш, чтобы при повторе пропустить уже скачанное.
  let cache: Record<string, FnsParsed> = {};
  if (existsSync(OUT_FILE) && !FORCE) {
    try {
      cache = JSON.parse(readFileSync(OUT_FILE, "utf-8"));
      console.log(`Resuming: ${Object.keys(cache).length} cached records`);
    } catch {
      cache = {};
    }
  }

  const fns = await prisma.fnsOffice.findMany({
    select: { code: true },
    orderBy: { code: "asc" },
  });
  const todo = fns.filter((f) => FORCE || !cache[f.code]);
  console.log(`To scrape: ${todo.length} of ${fns.length}`);

  let ok = 0, missing = 0, errors = 0, skipped = 0;
  let i = 0;
  for (const f of todo) {
    const result = await scrapeOne(f.code);
    cache[f.code] = result;
    i++;

    if (result.status === "ok") ok++;
    else if (result.status === "404") missing++;
    else if (result.status === "skip") skipped++;
    else errors++;

    if (i % 25 === 0 || i === todo.length) {
      console.log(`  ${i}/${todo.length} (ok=${ok} miss=${missing} skip=${skipped} err=${errors})`);
      mkdirSync(dirname(OUT_FILE), { recursive: true });
      writeFileSync(OUT_FILE, JSON.stringify(cache, null, 2));
    }
  }

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(cache, null, 2));
  console.log(`Done. ok=${ok} miss=${missing} skip=${skipped} err=${errors}, total: ${Object.keys(cache).length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
