-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('PENDING', 'REVIEWED', 'DISMISSED');

-- AlterTable
ALTER TABLE "complaints" ADD COLUMN "status" "ComplaintStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex (unique: one complaint per user per target)
CREATE UNIQUE INDEX "complaints_reporterId_targetId_key" ON "complaints"("reporterId", "targetId");
