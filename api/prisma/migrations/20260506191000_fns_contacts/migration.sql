ALTER TABLE "fns_offices"
  ADD COLUMN IF NOT EXISTS "inn"              TEXT,
  ADD COLUMN IF NOT EXISTS "kpp"              TEXT,
  ADD COLUMN IF NOT EXISTS "oktmo"            TEXT,
  ADD COLUMN IF NOT EXISTS "official_phone"   TEXT,
  ADD COLUMN IF NOT EXISTS "official_email"   TEXT,
  ADD COLUMN IF NOT EXISTS "official_website" TEXT,
  ADD COLUMN IF NOT EXISTS "working_hours"    TEXT;
