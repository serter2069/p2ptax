-- AlterTable: add last_seen_at to users
ALTER TABLE "users" ADD COLUMN "last_seen_at" TIMESTAMP(3);
