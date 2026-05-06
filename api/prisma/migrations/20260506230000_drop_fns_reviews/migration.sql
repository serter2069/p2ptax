-- Удаляем отзывы на ИФНС и сотрудников: убрали из UI, синтетика
-- была удалена скриптом cleanup-fns-rebuild-from-dadata.ts.

DROP TABLE IF EXISTS "fns_staff_reviews";
DROP TABLE IF EXISTS "fns_reviews";

-- Кэш агрегатов больше не нужен — отзывов нет.
ALTER TABLE "fns_staff"
  DROP COLUMN IF EXISTS "cached_avg_rating",
  DROP COLUMN IF EXISTS "cached_reviews_count";
