-- AlterTable
ALTER TABLE "threads" ADD COLUMN "requestId" TEXT;

-- AddForeignKey
ALTER TABLE "threads" ADD CONSTRAINT "threads_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
