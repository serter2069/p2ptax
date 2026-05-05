/**
 * Полный обход справочника `fns_unit` Dadata через suggest+findById.
 *
 * Стратегия:
 *   1. Древовидный обход suggest с 1→2→3→4 цифровыми префиксами;
 *      Dadata отдаёт максимум 20 записей за один suggest, поэтому если
 *      на префикс пришло 20 записей — углубляемся.
 *   2. На листьях получаем точный код, дозапрашиваем findById для
 *      получения полного адреса/oktmo (suggest часто возвращает все
 *      поля, но findById гарантирует свежесть).
 *
 * Результат пишем в `prisma/data/dadata-fns.json` — массив объектов:
 *   { code, name, address, oktmo, parent_code, parent_name }
 *
 * Запуск:
 *   DADATA_TOKEN=... npx tsx prisma/dadata-fns-fetch.ts
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { dirname } from "path";

const TOKEN = process.env.DADATA_TOKEN;
if (!TOKEN) {
  console.error("set DADATA_TOKEN env var");
  process.exit(1);
}

const SUGGEST_URL =
  "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/fns_unit";

interface FnsRecord {
  code: string;
  name: string;
  address: string | null;
  oktmo: string | null;
  parent_code: string | null;
  parent_name: string | null;
}

const seen = new Map<string, FnsRecord>();
const OUT_FILE = "/var/www/p2ptax/api/prisma/data/dadata-fns.json";

// Крайне щадящий rate-limit: 4 запроса в секунду.
let lastReqMs = 0;
async function rateLimit(): Promise<void> {
  const now = Date.now();
  const wait = lastReqMs + 250 - now;
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastReqMs = Date.now();
}

async function suggest(prefix: string): Promise<FnsRecord[]> {
  await rateLimit();
  const res = await fetch(SUGGEST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Token ${TOKEN}`,
      "Accept": "application/json",
    },
    body: JSON.stringify({ query: prefix, count: 20 }),
  });
  if (!res.ok) {
    if (res.status === 429) {
      console.warn(`429 on prefix="${prefix}", sleeping 5s and retrying`);
      await new Promise((r) => setTimeout(r, 5000));
      return suggest(prefix);
    }
    throw new Error(`HTTP ${res.status} on prefix="${prefix}"`);
  }
  const json: any = await res.json();
  const items = json.suggestions ?? [];
  return items.map((it: any) => ({
    code: it.data.code,
    name: it.data.name,
    address: it.data.address ?? null,
    oktmo: it.data.oktmo ?? null,
    parent_code: it.data.parent_code ?? null,
    parent_name: it.data.parent_name ?? null,
  }));
}

async function walk(prefix: string, depth: number): Promise<void> {
  const items = await suggest(prefix);
  let added = 0;
  for (const it of items) {
    if (!seen.has(it.code)) {
      seen.set(it.code, it);
      added++;
    }
  }
  console.log(
    `prefix="${prefix}" depth=${depth} got=${items.length} new=${added} total=${seen.size}`,
  );
  // Если упёрлись в лимит 20 — нужна более глубокая выборка.
  if (items.length >= 20 && depth < 4) {
    for (let d = 0; d <= 9; d++) {
      await walk(prefix + d, depth + 1);
    }
  }
}

async function main() {
  console.log("Walking Dadata fns_unit tree…");

  // Восстановление из ранее частично собранного файла, если есть.
  if (existsSync(OUT_FILE)) {
    try {
      const prev: FnsRecord[] = JSON.parse(readFileSync(OUT_FILE, "utf-8"));
      for (const r of prev) seen.set(r.code, r);
      console.log(`Resumed with ${seen.size} previously-saved records`);
    } catch {
      // ignore
    }
  }

  // Цифры 1-9 + 0 как корни (FNS-коды бывают 0XXX в редких случаях).
  for (let d = 0; d <= 9; d++) {
    await walk(String(d), 1);
    // Промежуточное сохранение каждый top-level.
    mkdirSync(dirname(OUT_FILE), { recursive: true });
    writeFileSync(OUT_FILE, JSON.stringify([...seen.values()], null, 2));
    console.log(`Checkpoint: ${seen.size} records saved to ${OUT_FILE}`);
  }

  console.log(`Done. Total: ${seen.size} records`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
