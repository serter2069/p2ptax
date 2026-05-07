-- Юзер выбирает свою ИФНС для контекста налогового консультанта.
-- Раньше хранилось локально в localStorage, теперь — в БД, чтобы:
--   1) синхронизировалось между устройствами;
--   2) бот мог сам спросить и записать;
--   3) админ видел в профиле.
ALTER TABLE "users"
    ADD COLUMN "consultant_fns_id" TEXT;

ALTER TABLE "users"
    ADD CONSTRAINT "users_consultant_fns_id_fkey"
    FOREIGN KEY ("consultant_fns_id") REFERENCES "fns_offices"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "users_consultant_fns_id_idx" ON "users"("consultant_fns_id");
