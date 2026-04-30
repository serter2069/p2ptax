-- Make requestId optional on threads (enables direct threads without a request)
ALTER TABLE "threads" ALTER COLUMN "request_id" DROP NOT NULL;

-- Add partial unique index for direct threads (request_id IS NULL)
-- Prevents duplicate direct threads between same client+specialist pair
CREATE UNIQUE INDEX "threads_direct_unique"
  ON "threads" ("client_id", "specialist_id")
  WHERE "request_id" IS NULL;
