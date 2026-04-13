-- Rename message column to comment
ALTER TABLE "responses" RENAME COLUMN "message" TO "comment";

-- Make price required (set default 0 for any existing NULL rows, then add NOT NULL)
UPDATE "responses" SET "price" = 0 WHERE "price" IS NULL;
ALTER TABLE "responses" ALTER COLUMN "price" SET NOT NULL;
ALTER TABLE "responses" ALTER COLUMN "price" SET DEFAULT 0;

-- Make deadline required (set a far-future default for any existing NULL rows, then add NOT NULL)
UPDATE "responses" SET "deadline" = NOW() + INTERVAL '30 days' WHERE "deadline" IS NULL;
ALTER TABLE "responses" ALTER COLUMN "deadline" SET NOT NULL;
