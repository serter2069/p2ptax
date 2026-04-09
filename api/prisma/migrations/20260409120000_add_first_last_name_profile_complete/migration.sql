-- AlterTable: add firstName, lastName to users
ALTER TABLE "users" ADD COLUMN "firstName" TEXT;
ALTER TABLE "users" ADD COLUMN "lastName" TEXT;

-- AlterTable: add profileComplete to specialist_profiles
ALTER TABLE "specialist_profiles" ADD COLUMN "profileComplete" BOOLEAN NOT NULL DEFAULT false;
