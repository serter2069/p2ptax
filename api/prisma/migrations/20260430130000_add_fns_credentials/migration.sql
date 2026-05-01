-- AlterTable: SpecialistProfile — verified ex-FNS credentials + cached response-time SLA
ALTER TABLE "specialist_profiles"
  ADD COLUMN "ex_fns_office" TEXT,
  ADD COLUMN "verified_ex_fns" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "cached_avg_response_minutes" INTEGER;
