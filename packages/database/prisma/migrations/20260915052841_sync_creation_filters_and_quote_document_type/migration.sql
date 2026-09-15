-- AlterEnum
ALTER TYPE "MediaEntityType" ADD VALUE 'QUOTE_DOCUMENT';

-- AlterTable
ALTER TABLE "creations" ADD COLUMN     "color" TEXT,
ADD COLUMN     "genre" TEXT,
ADD COLUMN     "style" TEXT,
ADD COLUMN     "type" TEXT;

-- CreateIndex
CREATE INDEX "creations_genre_idx" ON "creations"("genre");

-- CreateIndex
CREATE INDEX "creations_type_idx" ON "creations"("type");

-- CreateIndex
CREATE INDEX "creations_color_idx" ON "creations"("color");

-- CreateIndex
CREATE INDEX "creations_style_idx" ON "creations"("style");
