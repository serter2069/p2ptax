-- CreateTable
CREATE TABLE IF NOT EXISTS "saved_specialists" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "specialistId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_specialists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "saved_specialists_userId_specialistId_key" ON "saved_specialists"("userId", "specialistId");

-- AddForeignKey
ALTER TABLE "saved_specialists" ADD CONSTRAINT "saved_specialists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_specialists" ADD CONSTRAINT "saved_specialists_specialistId_fkey" FOREIGN KEY ("specialistId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
