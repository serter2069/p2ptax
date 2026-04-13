-- AlterEnum: Add CLOSING_SOON to RequestStatus
ALTER TYPE "RequestStatus" ADD VALUE 'CLOSING_SOON';

-- AlterTable: add lifecycle fields to Request
ALTER TABLE "requests" ADD COLUMN "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "requests" ADD COLUMN "extensionsCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex: for cron job queries on status + lastActivityAt
CREATE INDEX "requests_status_lastActivityAt_idx" ON "requests"("status", "lastActivityAt");
