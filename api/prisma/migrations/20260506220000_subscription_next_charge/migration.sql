-- Поле для следующего планового платежа подписки PRO. Раньше cron
-- списывал ежедневно; теперь — раз в 30 дней по этому полю.
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "subscription_next_charge_at" TIMESTAMP(3);

-- Бэкфилл существующим подписчикам: следующее списание = startedAt + 30 дней.
-- Если subscriptionStartedAt NULL — оставляем next NULL (подписки нет).
UPDATE "users"
SET "subscription_next_charge_at" = "subscription_started_at" + INTERVAL '30 days'
WHERE "subscription_started_at" IS NOT NULL
  AND "subscription_plan_id" IS NOT NULL
  AND "subscription_next_charge_at" IS NULL;
