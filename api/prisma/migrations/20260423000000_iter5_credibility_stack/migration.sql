-- AlterTable: SpecialistProfile — credibility stack fields
ALTER TABLE "specialist_profiles" ADD COLUMN     "certifications" JSONB,
ADD COLUMN     "ex_fns_end_year" INTEGER,
ADD COLUMN     "ex_fns_start_year" INTEGER,
ADD COLUMN     "specializations" JSONB,
ADD COLUMN     "years_of_experience" INTEGER;

-- CreateTable
CREATE TABLE "specialist_cases" (
    "id" TEXT NOT NULL,
    "specialist_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" INTEGER,
    "resolved_amount" INTEGER,
    "days" INTEGER,
    "status" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "year" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "specialist_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specialist_reviews" (
    "id" TEXT NOT NULL,
    "specialist_id" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "text" TEXT NOT NULL,
    "category_chips" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "specialist_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "specialist_cases_specialist_id_idx" ON "specialist_cases"("specialist_id");

-- CreateIndex
CREATE INDEX "specialist_reviews_specialist_id_idx" ON "specialist_reviews"("specialist_id");

-- AddForeignKey
ALTER TABLE "specialist_cases" ADD CONSTRAINT "specialist_cases_specialist_id_fkey" FOREIGN KEY ("specialist_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "specialist_reviews" ADD CONSTRAINT "specialist_reviews_specialist_id_fkey" FOREIGN KEY ("specialist_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
