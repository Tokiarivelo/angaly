-- AlterEnum
ALTER TYPE "MediaEntityType" ADD VALUE 'PRODUCT_VARIANT';

-- CreateTable
CREATE TABLE "_ProductVariantMedia" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductVariantMedia_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ProductVariantMedia_B_index" ON "_ProductVariantMedia"("B");

-- AddForeignKey
ALTER TABLE "_ProductVariantMedia" ADD CONSTRAINT "_ProductVariantMedia_A_fkey" FOREIGN KEY ("A") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductVariantMedia" ADD CONSTRAINT "_ProductVariantMedia_B_fkey" FOREIGN KEY ("B") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
