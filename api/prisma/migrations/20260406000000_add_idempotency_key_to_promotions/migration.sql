-- AlterTable
ALTER TABLE "promotions" ADD COLUMN "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "promotions_idempotencyKey_key" ON "promotions"("idempotencyKey");
