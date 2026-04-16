-- =============================================================================
-- Schema cleanup: unify RequestStatus to 3 values, drop NEW_RESPONSE + PushToken
-- =============================================================================
-- Aligns DB with MVP SA: biz-request-lifecycle (3 statuses) + biz-notifications
-- (email-only for MVP). Push notifications postponed to post-MVP.
--
-- Data backfill mapping for requests.status:
--   NEW          -> ACTIVE
--   OPEN         -> ACTIVE
--   IN_PROGRESS  -> ACTIVE
--   CLOSING_SOON -> CLOSING_SOON (unchanged)
--   CLOSED       -> CLOSED       (unchanged)
--   CANCELLED    -> CLOSED       (concept removed)
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1. RequestStatus enum collapse
-- ----------------------------------------------------------------------------
-- Drop existing default on requests.status so we can swap the column type.
ALTER TABLE "requests" ALTER COLUMN "status" DROP DEFAULT;

-- Rename old enum, create new enum, migrate column, drop old enum.
ALTER TYPE "RequestStatus" RENAME TO "RequestStatus_old";

CREATE TYPE "RequestStatus" AS ENUM ('ACTIVE', 'CLOSING_SOON', 'CLOSED');

ALTER TABLE "requests"
  ALTER COLUMN "status" TYPE "RequestStatus"
  USING (
    CASE "status"::text
      WHEN 'NEW' THEN 'ACTIVE'::"RequestStatus"
      WHEN 'OPEN' THEN 'ACTIVE'::"RequestStatus"
      WHEN 'IN_PROGRESS' THEN 'ACTIVE'::"RequestStatus"
      WHEN 'CLOSING_SOON' THEN 'CLOSING_SOON'::"RequestStatus"
      WHEN 'CLOSED' THEN 'CLOSED'::"RequestStatus"
      WHEN 'CANCELLED' THEN 'CLOSED'::"RequestStatus"
      ELSE 'ACTIVE'::"RequestStatus"
    END
  );

ALTER TABLE "requests" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

DROP TYPE "RequestStatus_old";

-- ----------------------------------------------------------------------------
-- 2. NotificationType: drop NEW_RESPONSE value
-- ----------------------------------------------------------------------------
-- Recreate the enum without NEW_RESPONSE. Existing rows using NEW_RESPONSE
-- are remapped to SYSTEM so nothing is lost.
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";

CREATE TYPE "NotificationType" AS ENUM ('NEW_MESSAGE', 'REQUEST_UPDATE', 'REVIEW', 'SYSTEM');

ALTER TABLE "notifications"
  ALTER COLUMN "type" TYPE "NotificationType"
  USING (
    CASE "type"::text
      WHEN 'NEW_RESPONSE' THEN 'SYSTEM'::"NotificationType"
      ELSE "type"::text::"NotificationType"
    END
  );

DROP TYPE "NotificationType_old";

-- ----------------------------------------------------------------------------
-- 3. Drop notifyNewResponses preference from users
-- ----------------------------------------------------------------------------
ALTER TABLE "users" DROP COLUMN IF EXISTS "notifyNewResponses";

-- ----------------------------------------------------------------------------
-- 4. Drop push_tokens table (push notifications postponed to post-MVP)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS "push_tokens";
