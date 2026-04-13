-- Add documents JSON column to Request model
ALTER TABLE "requests" ADD COLUMN "documents" JSONB NOT NULL DEFAULT '[]';
