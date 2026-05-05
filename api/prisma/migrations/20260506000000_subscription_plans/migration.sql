-- PRO plans table + per-user plan reference. Idempotent.
-- Seeds three default plans (Lite/Pro/Premium); admin can edit them
-- on /admin/plans, but at least one row must exist before /me/plans
-- can return non-empty results.

CREATE TABLE IF NOT EXISTS "subscription_plans" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monthly_price_kopeks" INTEGER NOT NULL,
    "fns_limit" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "subscription_plans_code_key"
    ON "subscription_plans"("code");

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscription_plan_id" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscription_started_at" TIMESTAMP(3);

DO $$ BEGIN
    ALTER TABLE "users"
        ADD CONSTRAINT "users_subscription_plan_id_fkey"
        FOREIGN KEY ("subscription_plan_id") REFERENCES "subscription_plans"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed Lite / Pro / Premium with sensible defaults. Admin can
-- override prices and limits later via /admin/plans.
INSERT INTO "subscription_plans" (id, code, name, monthly_price_kopeks, fns_limit, sort_order)
VALUES
    (gen_random_uuid()::text, 'lite',    'Lite',    50000,  1,  10),
    (gen_random_uuid()::text, 'pro',     'Pro',     150000, 5,  20),
    (gen_random_uuid()::text, 'premium', 'Premium', 400000, 20, 30)
ON CONFLICT (code) DO NOTHING;
