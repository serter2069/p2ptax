-- Iter11 — role unification
-- CLIENT + SPECIALIST merged into a single USER value. Specialist features
-- become opt-in via new `is_specialist` flag + `specialist_profile_completed_at`.
-- Enum transition: CLIENT/SPECIALIST -> USER; GUEST added; ADMIN unchanged.

-- 1. Add new User columns (idempotent — defaults cover new rows).
ALTER TABLE "users" ADD COLUMN "is_specialist" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "users" ADD COLUMN "specialist_profile_completed_at" TIMESTAMP(3);

-- 2. Seed isSpecialist + completion timestamp BEFORE the enum swap,
--    while the old CLIENT/SPECIALIST labels still exist.
UPDATE "users"
   SET "is_specialist" = TRUE,
       "specialist_profile_completed_at" = COALESCE("specialist_profile_completed_at", "created_at")
 WHERE "role" = 'SPECIALIST';

-- 3. Rebuild the Role enum: add USER + GUEST, retire CLIENT + SPECIALIST.
--    Postgres can't ALTER TYPE to drop values safely, so we rename the old
--    enum and create a fresh one, remapping rows in place.
ALTER TYPE "Role" RENAME TO "Role_old";
CREATE TYPE "Role" AS ENUM ('GUEST', 'USER', 'ADMIN');

-- 4. Swap column type; remap legacy values CLIENT/SPECIALIST -> USER.
ALTER TABLE "users"
  ALTER COLUMN "role" DROP DEFAULT,
  ALTER COLUMN "role" TYPE "Role" USING (
    CASE
      WHEN "role"::text = 'CLIENT' THEN 'USER'::"Role"
      WHEN "role"::text = 'SPECIALIST' THEN 'USER'::"Role"
      WHEN "role"::text = 'ADMIN' THEN 'ADMIN'::"Role"
      ELSE NULL
    END
  );

-- 5. Drop the retired enum so only the new one remains.
DROP TYPE "Role_old";
