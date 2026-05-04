-- AlterTable
ALTER TABLE "requests" ADD COLUMN "service_id" TEXT;

-- AddForeignKey
ALTER TABLE "requests"
  ADD CONSTRAINT "requests_service_id_fkey"
  FOREIGN KEY ("service_id") REFERENCES "services"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
