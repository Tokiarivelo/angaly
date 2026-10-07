-- CreateEnum
CREATE TYPE "PatternLearningOutcome" AS ENUM ('GENERATED', 'EXPORTED');

-- CreateTable
CREATE TABLE "pattern_learning_records" (
    "id" TEXT NOT NULL,
    "patternProjectId" TEXT NOT NULL,
    "garmentType" TEXT NOT NULL,
    "occasion" TEXT,
    "style" TEXT,
    "cutType" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "outcome" "PatternLearningOutcome" NOT NULL DEFAULT 'GENERATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pattern_learning_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pattern_learning_records_patternProjectId_key" ON "pattern_learning_records"("patternProjectId");

-- CreateIndex
CREATE INDEX "pattern_learning_records_garmentType_idx" ON "pattern_learning_records"("garmentType");
