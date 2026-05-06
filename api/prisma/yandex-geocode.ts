/**
 * Геокодирование всех ИФНС через HTTP Геокодер Яндекс.Карт.
 *
 * Тариф Геокодера: 25k запросов в день бесплатно. У нас ~527
 * записей, влезаем в один прогон с большим запасом. Скрипт
 * идемпотентен: если у записи уже есть latitude — пропускаем
 * (можно форсировать через `--force`).
 *
 * Запуск:
 *   YANDEX_GEOCODER_KEY=… npx tsx prisma/yandex-geocode.ts
 *   YANDEX_GEOCODER_KEY=… npx tsx prisma/yandex-geocode.ts --force
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const KEY = process.env.YANDEX_GEOCODER_KEY;
if (!KEY) {
  console.error("set YANDEX_GEOCODER_KEY env var");
  process.exit(1);
}

const FORCE = process.argv.includes("--force");

const GEOCODER = "https://geocode-maps.yandex.ru/1.x/";

interface GeocoderResponse {
  response: {
    GeoObjectCollection: {
      featureMember: Array<{
        GeoObject: {
          Point: { pos: string }; // "lon lat"
          metaDataProperty?: { GeocoderMetaData?: { precision?: string } };
        };
      }>;
    };
  };
}

let lastReqMs = 0;
async function rateLimit(): Promise<void> {
  // Geocoder: 50 RPS на инстанс. Едем 4 RPS чтоб точно не словить
  // 429 при параллельных скриптах.
  const now = Date.now();
  const wait = lastReqMs + 250 - now;
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastReqMs = Date.now();
}

async function geocode(query: string): Promise<{ lat: number; lon: number; precision: string } | null> {
  await rateLimit();
  const url = new URL(GEOCODER);
  url.searchParams.set("apikey", KEY!);
  url.searchParams.set("geocode", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("results", "1");
  url.searchParams.set("lang", "ru_RU");

  const res = await fetch(url.toString());
  if (!res.ok) {
    if (res.status === 429) {
      console.warn("429 — sleep 5s");
      await new Promise((r) => setTimeout(r, 5000));
      return geocode(query);
    }
    throw new Error(`geocoder HTTP ${res.status} for "${query}"`);
  }
  const json = (await res.json()) as GeocoderResponse;
  const fm = json.response?.GeoObjectCollection?.featureMember ?? [];
  if (fm.length === 0) return null;
  const obj = fm[0].GeoObject;
  const pos = obj.Point?.pos; // "lon lat"
  if (!pos) return null;
  const [lonStr, latStr] = pos.split(/\s+/);
  const lon = parseFloat(lonStr);
  const lat = parseFloat(latStr);
  if (isNaN(lon) || isNaN(lat)) return null;
  const precision = obj.metaDataProperty?.GeocoderMetaData?.precision ?? "unknown";
  return { lat, lon, precision };
}

async function main() {
  const where = FORCE ? {} : { latitude: null };
  const fns = await prisma.fnsOffice.findMany({
    where,
    include: { city: true },
    orderBy: { code: "asc" },
  });

  console.log(`Pending: ${fns.length} (force=${FORCE})`);

  let ok = 0;
  let miss = 0;
  let failed = 0;

  for (const f of fns) {
    const addr = f.address ?? "";
    const query = `${f.city.name}, ${addr}`.trim();
    if (!addr) {
      console.warn(`skip ${f.code}: no address`);
      miss++;
      continue;
    }
    try {
      const result = await geocode(query);
      if (!result) {
        console.warn(`miss ${f.code}: "${query}"`);
        miss++;
        continue;
      }
      await prisma.fnsOffice.update({
        where: { id: f.id },
        data: {
          latitude: result.lat,
          longitude: result.lon,
          geocodedAt: new Date(),
        },
      });
      ok++;
      if (ok % 25 === 0) {
        console.log(`progress: ${ok} geocoded, ${miss} missed, ${failed} failed`);
      }
    } catch (e) {
      console.error(`fail ${f.code}: ${(e as Error).message}`);
      failed++;
    }
  }

  console.log(`Done. Geocoded: ${ok}, missed: ${miss}, failed: ${failed}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
