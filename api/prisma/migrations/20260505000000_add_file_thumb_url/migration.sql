-- Optional small WebP thumbnail key for chat-file uploads.
-- Idempotent so the migration is safe to re-run on staging.
ALTER TABLE "files" ADD COLUMN IF NOT EXISTS "thumb_url" TEXT;
