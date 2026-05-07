-- Add kind + attachment_filename columns so we can mark some assistant
-- messages as generated documents (download-able by the user).
ALTER TABLE "consultant_messages"
    ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'text',
    ADD COLUMN "attachment_filename" TEXT;
