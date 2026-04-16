-- Align DB with schema.prisma — these columns were added to the schema
-- earlier without migrations, causing runtime P2022 errors on SELECT/INSERT
-- (e.g. /api/specialists returned 500 on staging, seed could not insert requests).
-- `IF NOT EXISTS` keeps it safe to re-run.

ALTER TABLE "specialist_profiles"
  ADD COLUMN IF NOT EXISTS "isAvailable" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "specialist_profiles"
  ADD COLUMN IF NOT EXISTS "phone" TEXT;

ALTER TABLE "specialist_profiles"
  ADD COLUMN IF NOT EXISTS "telegram" TEXT;

ALTER TABLE "specialist_profiles"
  ADD COLUMN IF NOT EXISTS "whatsapp" TEXT;

ALTER TABLE "specialist_profiles"
  ADD COLUMN IF NOT EXISTS "officeAddress" TEXT;

ALTER TABLE "specialist_profiles"
  ADD COLUMN IF NOT EXISTS "workingHours" TEXT;

-- `requests.title` was added to the schema without migration. Use a non-null
-- default so existing rows are safely backfilled. Application always provides a title.
ALTER TABLE "requests"
  ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT '';
