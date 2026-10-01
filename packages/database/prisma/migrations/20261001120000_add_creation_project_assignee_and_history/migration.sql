-- AlterTable
ALTER TABLE "creation_projects" ADD COLUMN "assignedToId" TEXT;

-- CreateTable
CREATE TABLE "creation_project_stage_events" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fromStage" "CreationProjectStage",
    "toStage" "CreationProjectStage" NOT NULL,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creation_project_stage_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "creation_projects_assignedToId_idx" ON "creation_projects"("assignedToId");
CREATE INDEX "creation_project_stage_events_projectId_createdAt_idx" ON "creation_project_stage_events"("projectId", "createdAt");

-- AddForeignKey
ALTER TABLE "creation_projects" ADD CONSTRAINT "creation_projects_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "creation_project_stage_events" ADD CONSTRAINT "creation_project_stage_events_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "creation_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "creation_project_stage_events" ADD CONSTRAINT "creation_project_stage_events_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
