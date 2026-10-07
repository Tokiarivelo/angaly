-- CreateTable
CREATE TABLE "inspiration_analyses" (
    "id" TEXT NOT NULL,
    "imageHash" TEXT NOT NULL,
    "features" JSONB NOT NULL,
    "suggestedCutType" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspiration_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inspiration_analyses_imageHash_key" ON "inspiration_analyses"("imageHash");
