-- CreateEnum
CREATE TYPE "AiProviderId" AS ENUM ('ANTHROPIC', 'GEMINI', 'OPENAI', 'META_MUSE', 'MISTRAL', 'GROQ', 'OPENROUTER', 'DEEPSEEK', 'TOGETHER', 'CEREBRAS', 'CUSTOM_OPENAI', 'LOCAL_STATISTICAL');

-- CreateEnum
CREATE TYPE "AiProviderStatus" AS ENUM ('UNTESTED', 'OK', 'INVALID');

-- CreateEnum
CREATE TYPE "AiUsage" AS ENUM ('MEASUREMENT_ESTIMATION', 'PATTERN_SUGGESTION');

-- AlterTable
ALTER TABLE "ai_model_settings" ADD COLUMN     "measurementProvider" "AiProviderId" NOT NULL DEFAULT 'GEMINI',
ADD COLUMN     "patternSuggestionProvider" "AiProviderId" NOT NULL DEFAULT 'GEMINI';

-- CreateTable
CREATE TABLE "ai_provider_configs" (
    "id" TEXT NOT NULL,
    "provider" "AiProviderId" NOT NULL,
    "model" TEXT NOT NULL,
    "baseUrl" TEXT,
    "apiKeyCipher" TEXT,
    "apiKeyLast4" TEXT,
    "status" "AiProviderStatus" NOT NULL DEFAULT 'UNTESTED',
    "lastTestedAt" TIMESTAMP(3),
    "lastLatencyMs" INTEGER,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_provider_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_provider_configs_provider_key" ON "ai_provider_configs"("provider");

-- AddForeignKey
ALTER TABLE "ai_provider_configs" ADD CONSTRAINT "ai_provider_configs_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
