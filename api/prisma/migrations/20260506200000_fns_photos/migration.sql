-- Фотографии ИФНС (фасад, оперзал и т.п.) с сайта nalog.gov.ru.
-- Храним массив URL — заполняется парсером prisma/scrape-nalog-gov.ts.

ALTER TABLE "fns_offices"
  ADD COLUMN IF NOT EXISTS "photo_urls"     TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "nalog_gov_url"  TEXT;
