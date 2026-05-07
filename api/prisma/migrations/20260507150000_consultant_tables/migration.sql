-- Consultant chat threads + messages (TaxLLM integration)
CREATE TABLE "consultant_threads" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT,
    "archived_from_user" BOOLEAN NOT NULL DEFAULT false,
    "context_overflowed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "consultant_threads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "consultant_threads_user_id_created_at_idx"
    ON "consultant_threads"("user_id", "created_at");

ALTER TABLE "consultant_threads"
    ADD CONSTRAINT "consultant_threads_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "consultant_messages" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sources_json" TEXT,
    "usage_json" TEXT,
    "debug_json" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "consultant_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "consultant_messages_thread_id_created_at_idx"
    ON "consultant_messages"("thread_id", "created_at");

ALTER TABLE "consultant_messages"
    ADD CONSTRAINT "consultant_messages_thread_id_fkey"
    FOREIGN KEY ("thread_id") REFERENCES "consultant_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
