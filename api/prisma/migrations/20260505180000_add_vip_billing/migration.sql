-- VIP wallet + per-FNS VIP toggles + ledger.
-- Idempotent so the migration is safe to re-run on staging.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "vip_balance_kopeks" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "fns_offices" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "fns_offices" ADD COLUMN IF NOT EXISTS "vip_monthly_price_kopeks" INTEGER;

CREATE TABLE IF NOT EXISTS "specialist_vip_fns" (
    "id" TEXT NOT NULL,
    "specialist_id" TEXT NOT NULL,
    "fns_id" TEXT NOT NULL,
    "activated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "specialist_vip_fns_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "specialist_vip_fns_specialist_id_fns_id_key"
    ON "specialist_vip_fns"("specialist_id", "fns_id");

CREATE INDEX IF NOT EXISTS "specialist_vip_fns_fns_id_idx"
    ON "specialist_vip_fns"("fns_id");

DO $$ BEGIN
    ALTER TABLE "specialist_vip_fns"
        ADD CONSTRAINT "specialist_vip_fns_specialist_id_fkey"
        FOREIGN KEY ("specialist_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "specialist_vip_fns"
        ADD CONSTRAINT "specialist_vip_fns_fns_id_fkey"
        FOREIGN KEY ("fns_id") REFERENCES "fns_offices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "billing_tx" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount_kopeks" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "fns_id" TEXT,
    "external_ref" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "billing_tx_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "billing_tx_user_id_created_at_idx"
    ON "billing_tx"("user_id", "created_at");

DO $$ BEGIN
    ALTER TABLE "billing_tx"
        ADD CONSTRAINT "billing_tx_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
