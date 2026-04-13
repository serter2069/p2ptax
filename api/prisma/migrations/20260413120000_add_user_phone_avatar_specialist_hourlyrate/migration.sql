-- AlterTable: add phone and avatarUrl to users
ALTER TABLE "users" ADD COLUMN "phone" TEXT;
ALTER TABLE "users" ADD COLUMN "avatarUrl" TEXT;

-- AlterTable: add hourlyRate to specialist_profiles
ALTER TABLE "specialist_profiles" ADD COLUMN "hourlyRate" INTEGER;
