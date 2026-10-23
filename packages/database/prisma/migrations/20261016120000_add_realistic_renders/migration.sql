-- Realistic renders (Blender cloth simulation) — job queue + cache. docs/features/realistic-render-blender.md
-- CreateEnum
CREATE TYPE "RealisticRenderStatus" AS ENUM ('QUEUED', 'RUNNING', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "realistic_renders" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "pose" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "status" "RealisticRenderStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "mediaId" TEXT,
    "glbUrl" TEXT,
    "simPoseJson" JSONB,
    "metricsJson" JSONB,
    "error" TEXT,
    "durationMs" INTEGER,
    "cachedFromId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "realistic_renders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "realistic_renders_status_createdAt_idx" ON "realistic_renders"("status", "createdAt");

-- CreateIndex
CREATE INDEX "realistic_renders_cacheKey_status_idx" ON "realistic_renders"("cacheKey", "status");

-- CreateIndex
CREATE INDEX "realistic_renders_requestedById_createdAt_idx" ON "realistic_renders"("requestedById", "createdAt");

-- AddForeignKey
ALTER TABLE "realistic_renders" ADD CONSTRAINT "realistic_renders_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "pattern_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

