-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('TREBOVANIE', 'RESHENIE', 'VYEZDNAYA', 'OTHER');

-- AlterTable
ALTER TABLE "requests"
  ADD COLUMN "document_type" "DocumentType",
  ADD COLUMN "incident_date" TIMESTAMP(3),
  ADD COLUMN "urgency" BOOLEAN DEFAULT false,
  ADD COLUMN "disputed_amount" INTEGER;
