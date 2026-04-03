-- AlterTable
ALTER TABLE "promotions" ADD COLUMN "reminderSent" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "promotions_reminderSent_expiresAt_idx" ON "promotions"("reminderSent", "expiresAt");
