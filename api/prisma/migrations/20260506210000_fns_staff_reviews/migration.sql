ALTER TABLE "fns_staff"
  ADD COLUMN IF NOT EXISTS "cached_avg_rating"     DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "cached_reviews_count"  INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "fns_staff_reviews" (
  "id"          TEXT PRIMARY KEY,
  "staff_id"    TEXT NOT NULL,
  "user_id"     TEXT,
  "author_name" TEXT NOT NULL,
  "rating"      INTEGER NOT NULL,
  "text"        TEXT NOT NULL,
  "source"      TEXT NOT NULL DEFAULT 'user',
  "created_at"  TIMESTAMP(3) DEFAULT NOW(),
  CONSTRAINT "fns_staff_reviews_staff_id_fkey"
    FOREIGN KEY ("staff_id") REFERENCES "fns_staff"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "fns_staff_reviews_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "fns_staff_reviews_staff_id_idx" ON "fns_staff_reviews"("staff_id");
CREATE INDEX IF NOT EXISTS "fns_staff_reviews_user_id_idx"  ON "fns_staff_reviews"("user_id");
