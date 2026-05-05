-- Swap pre-paid wallet for ЮKassa recurring autopay.
--   • drop users.vip_balance_kopeks
--   • add users.yookassa_payment_method_id (saved card token)
--   • add users.yookassa_payment_method_title (e.g. "Visa *4242")
--   • add users.last_charge_failed_at (for the "обновите карту" banner)
-- Idempotent — safe to re-run.

ALTER TABLE "users" DROP COLUMN IF EXISTS "vip_balance_kopeks";
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "yookassa_payment_method_id" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "yookassa_payment_method_title" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_charge_failed_at" TIMESTAMP(3);
