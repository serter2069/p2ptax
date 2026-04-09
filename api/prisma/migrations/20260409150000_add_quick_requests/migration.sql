-- CreateTable
CREATE TABLE "quick_requests" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "city" TEXT,
    "ifnsId" TEXT,
    "ifnsName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quick_requests_pkey" PRIMARY KEY ("id")
);
