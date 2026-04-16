-- DropForeignKey
ALTER TABLE "responses" DROP CONSTRAINT IF EXISTS "responses_specialistId_fkey";

-- DropForeignKey
ALTER TABLE "responses" DROP CONSTRAINT IF EXISTS "responses_requestId_fkey";

-- AlterTable: add new Thread columns for direct-chat flow
ALTER TABLE "threads"
  ADD COLUMN IF NOT EXISTS "clientLastReadAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "lastMessageAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "specialistId" TEXT,
  ADD COLUMN IF NOT EXISTS "specialistLastReadAt" TIMESTAMP(3);

-- DropTable
DROP TABLE IF EXISTS "responses";

-- DropEnum
DROP TYPE IF EXISTS "ResponseStatus";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "threads_requestId_idx" ON "threads"("requestId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "threads_specialistId_idx" ON "threads"("specialistId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "threads_requestId_specialistId_key" ON "threads"("requestId", "specialistId");
