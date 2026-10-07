-- CreateTable
CREATE TABLE "creation_project_stage_notes" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "stage" "CreationProjectStage" NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creation_project_stage_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creation_project_stage_media" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "stage" "CreationProjectStage" NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "fileName" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creation_project_stage_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "creation_project_stage_notes_projectId_stage_createdAt_idx" ON "creation_project_stage_notes"("projectId", "stage", "createdAt");

-- CreateIndex
CREATE INDEX "creation_project_stage_media_projectId_stage_createdAt_idx" ON "creation_project_stage_media"("projectId", "stage", "createdAt");

-- AddForeignKey
ALTER TABLE "creation_project_stage_notes" ADD CONSTRAINT "creation_project_stage_notes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "creation_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creation_project_stage_notes" ADD CONSTRAINT "creation_project_stage_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creation_project_stage_media" ADD CONSTRAINT "creation_project_stage_media_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "creation_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creation_project_stage_media" ADD CONSTRAINT "creation_project_stage_media_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
