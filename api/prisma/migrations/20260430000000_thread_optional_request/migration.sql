-- Make request_id optional on threads to support direct client→specialist threads
-- (threads created from the specialist catalog 'Написать' button, without a request).
ALTER TABLE "threads" ALTER COLUMN "request_id" DROP NOT NULL;

-- Add index on (client_id, specialist_id) for direct-thread lookup.
CREATE INDEX IF NOT EXISTS "threads_client_id_specialist_id_idx" ON "threads"("client_id", "specialist_id");
