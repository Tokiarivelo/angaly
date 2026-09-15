-- CreateEnum
CREATE TYPE "AiMeasurementModel" AS ENUM ('GEMINI', 'LOCAL_STATISTICAL');

-- CreateTable
CREATE TABLE "ai_model_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "measurementModel" "AiMeasurementModel" NOT NULL DEFAULT 'GEMINI',
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_model_settings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ai_model_settings" ADD CONSTRAINT "ai_model_settings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
