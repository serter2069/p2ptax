-- Soft-delete column for User model.
-- When non-null, the user is considered deleted: PII anonymized in-place,
-- hidden from public catalog/queries, but the row is preserved so threads
-- and messages keep a valid foreign-key target.
ALTER TABLE "users" ADD COLUMN "deleted_at" TIMESTAMP(3);
