-- CreateEnum: ResponseStatus
CREATE TYPE "ResponseStatus" AS ENUM ('sent', 'viewed', 'accepted', 'deactivated');

-- AlterTable: add lifecycle fields to responses
ALTER TABLE "responses" ADD COLUMN "status" "ResponseStatus" NOT NULL DEFAULT 'sent';
ALTER TABLE "responses" ADD COLUMN "price" INTEGER;
ALTER TABLE "responses" ADD COLUMN "deadline" TIMESTAMP(3);
ALTER TABLE "responses" ADD COLUMN "viewedAt" TIMESTAMP(3);
ALTER TABLE "responses" ADD COLUMN "acceptedAt" TIMESTAMP(3);
