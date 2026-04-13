-- Add granular notification preference fields
ALTER TABLE "users" ADD COLUMN "notifyNewResponses" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "notifyNewMessages" BOOLEAN NOT NULL DEFAULT true;

-- Migrate existing emailNotifications=true → both new fields true
-- (new fields already default to true, so only need to set false where old was false)
UPDATE "users" SET "notifyNewResponses" = false, "notifyNewMessages" = false
WHERE "emailNotifications" = false;

-- Drop old single boolean field
ALTER TABLE "users" DROP COLUMN "emailNotifications";
