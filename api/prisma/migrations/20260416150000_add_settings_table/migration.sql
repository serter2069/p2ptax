-- =============================================================================
-- Add settings table — fixes POST /api/requests 500 (missing public.settings)
-- =============================================================================
-- Schema had `model Setting` but no migration ever created it. RequestsService
-- .getMaxRequests() + AdminService settings endpoints rely on this table.
-- Seeds one default row so getMaxRequests() returns 5 immediately.
-- =============================================================================

CREATE TABLE IF NOT EXISTS "settings" (
  "id"    TEXT NOT NULL,
  "key"   TEXT NOT NULL,
  "value" TEXT NOT NULL,

  CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "settings_key_key" ON "settings"("key");

-- Seed default max requests per client (idempotent)
INSERT INTO "settings" ("id", "key", "value")
VALUES ('seed_max_requests_per_client', 'max_requests_per_client', '5')
ON CONFLICT ("key") DO NOTHING;
