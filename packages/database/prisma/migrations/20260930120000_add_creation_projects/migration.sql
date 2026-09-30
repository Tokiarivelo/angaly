-- CreateEnum
CREATE TYPE "CreationProjectStage" AS ENUM ('CONSULTATION', 'CONCEPTION', 'PATRON', 'CONFECTION', 'ESSAYAGE', 'TERMINEE');

-- CreateTable
CREATE TABLE "creation_projects" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "stage" "CreationProjectStage" NOT NULL DEFAULT 'CONSULTATION',
    "quoteId" TEXT,
    "creationId" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creation_projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "creation_projects_reference_key" ON "creation_projects"("reference");
CREATE INDEX "creation_projects_customerId_createdAt_idx" ON "creation_projects"("customerId", "createdAt");
CREATE INDEX "creation_projects_stage_idx" ON "creation_projects"("stage");

-- AddForeignKey
ALTER TABLE "creation_projects" ADD CONSTRAINT "creation_projects_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "creation_projects" ADD CONSTRAINT "creation_projects_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "creation_projects" ADD CONSTRAINT "creation_projects_creationId_fkey" FOREIGN KEY ("creationId") REFERENCES "creations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
