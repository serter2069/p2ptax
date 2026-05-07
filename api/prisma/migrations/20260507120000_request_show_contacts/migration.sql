-- Контакты клиента в запросе. show_contacts управляется чекбоксом
-- при создании запроса; contact_phone клиент вводит вручную.
-- Email берётся из user.email и тоже скрывается за show_contacts.

ALTER TABLE "requests"
  ADD COLUMN "show_contacts" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "contact_phone" TEXT;
