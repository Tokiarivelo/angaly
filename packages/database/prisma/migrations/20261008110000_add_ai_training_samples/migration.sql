-- CreateEnum
CREATE TYPE "AiTrainingSampleStatus" AS ENUM ('COLLECTED', 'HUMAN_CONFIRMED', 'EXCLUDED');

-- CreateTable
CREATE TABLE "ai_training_samples" (
    "id" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "imageUrl" TEXT,
    "output" JSONB NOT NULL,
    "humanLabel" JSONB,
    "providerId" TEXT,
    "modelVersion" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "status" "AiTrainingSampleStatus" NOT NULL DEFAULT 'COLLECTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_training_samples_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_training_samples_task_inputHash_key" ON "ai_training_samples"("task", "inputHash");

-- CreateIndex
CREATE INDEX "ai_training_samples_task_status_idx" ON "ai_training_samples"("task", "status");
