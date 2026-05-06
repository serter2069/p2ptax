CREATE TABLE IF NOT EXISTS "fns_staff" (
  "id"          TEXT PRIMARY KEY,
  "fns_id"      TEXT NOT NULL,
  "first_name"  TEXT NOT NULL,
  "last_name"   TEXT NOT NULL,
  "middle_name" TEXT,
  "position"    TEXT NOT NULL,
  "department"  TEXT,
  "phone"       TEXT,
  "email"       TEXT,
  "photo_url"   TEXT,
  "sort_order"  INTEGER NOT NULL DEFAULT 0,
  "source"      TEXT NOT NULL DEFAULT 'seed',
  "created_at"  TIMESTAMP(3) DEFAULT NOW(),
  "updated_at"  TIMESTAMP(3) DEFAULT NOW(),
  CONSTRAINT "fns_staff_fns_id_fkey"
    FOREIGN KEY ("fns_id") REFERENCES "fns_offices"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "fns_staff_fns_id_idx" ON "fns_staff"("fns_id");
