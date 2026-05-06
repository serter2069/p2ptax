CREATE TABLE IF NOT EXISTS "fns_reviews" (
  "id"          TEXT PRIMARY KEY,
  "fns_id"      TEXT NOT NULL,
  "author_name" TEXT NOT NULL,
  "rating"      INTEGER NOT NULL,
  "text"        TEXT NOT NULL,
  "source"      TEXT NOT NULL DEFAULT 'yandex_maps',
  "review_date" TIMESTAMP(3) NOT NULL,
  "created_at"  TIMESTAMP(3) DEFAULT NOW(),
  CONSTRAINT "fns_reviews_fns_id_fkey"
    FOREIGN KEY ("fns_id") REFERENCES "fns_offices"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "fns_reviews_fns_id_idx" ON "fns_reviews"("fns_id");
