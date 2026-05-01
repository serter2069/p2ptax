-- Make requestId optional on threads (enables direct threads without a request).
-- ALTER ... DROP NOT NULL is idempotent — safe to re-run.
ALTER TABLE "threads" ALTER COLUMN "request_id" DROP NOT NULL;

-- Add partial unique index for direct threads (request_id IS NULL).
-- Prevents duplicate direct threads between same client+specialist pair.
-- IF NOT EXISTS makes this idempotent if the migration is retried after a
-- prior partial run left the index half-built.
CREATE UNIQUE INDEX IF NOT EXISTS "threads_direct_unique"
  ON "threads" ("client_id", "specialist_id")
  WHERE "request_id" IS NULL;
