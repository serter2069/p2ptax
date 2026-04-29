-- AlterTable: add is_specialist flag to users
ALTER TABLE "users" ADD COLUMN "is_specialist" BOOLEAN NOT NULL DEFAULT false;
