-- Контакты пользователя — несколько штук разных типов, редактируются
-- в профиле, шарятся через тумблер на запросе. Заменяет одиночное
-- contact_phone на запросе.

CREATE TABLE "user_contacts" (
  "id"         TEXT NOT NULL,
  "user_id"    TEXT NOT NULL,
  "kind"       TEXT NOT NULL,
  "value"      TEXT NOT NULL,
  "label"      TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_contacts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_contacts_user_id_idx" ON "user_contacts"("user_id");

ALTER TABLE "user_contacts"
  ADD CONSTRAINT "user_contacts_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: для каждого пользователя с email создаём контакт kind=email.
-- Клиент сможет удалить его в профиле, если не хочет.
INSERT INTO "user_contacts" ("id", "user_id", "kind", "value", "sort_order", "created_at", "updated_at")
SELECT gen_random_uuid()::text, "id", 'email', "email", 0, NOW(), NOW()
FROM "users"
WHERE "email" IS NOT NULL AND "email" <> '' AND "deleted_at" IS NULL;

-- Старое одиночное поле телефона на запросе больше не нужно.
ALTER TABLE "requests" DROP COLUMN IF EXISTS "contact_phone";
