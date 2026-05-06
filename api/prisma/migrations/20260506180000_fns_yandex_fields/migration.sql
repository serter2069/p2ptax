-- Геокоординаты + Я.Карты Геопоиск-метаданные для каждой ИФНС.
-- Все поля nullable — заполняются офлайн-скриптами, существующие
-- 527 записей остаются валидными до первого прогонa.

ALTER TABLE "fns_offices"
  ADD COLUMN IF NOT EXISTS "latitude"             DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "longitude"            DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "geocoded_at"          TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "yandex_org_id"        TEXT,
  ADD COLUMN IF NOT EXISTS "yandex_org_url"       TEXT,
  ADD COLUMN IF NOT EXISTS "yandex_rating"        DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "yandex_reviews_count" INTEGER,
  ADD COLUMN IF NOT EXISTS "yandex_updated_at"    TIMESTAMP(3);
