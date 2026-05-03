-- Anonymous-session tracking on files for the pre-OTP upload flow.
ALTER TABLE "files" ADD COLUMN "session_id" TEXT;
ALTER TABLE "files" ADD COLUMN "expires_at" TIMESTAMP(3);
CREATE INDEX "files_session_id_idx" ON "files"("session_id");
CREATE INDEX "files_expires_at_idx" ON "files"("expires_at");
