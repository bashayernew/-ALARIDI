-- AlterTable
ALTER TABLE "Order" ADD COLUMN "branchId" TEXT;

-- AlterTable
ALTER TABLE "OfferBanner" ADD COLUMN "branchId" TEXT;

-- AlterTable
ALTER TABLE "HeaderOffer" ADD COLUMN "branchId" TEXT;

-- CreateIndex
CREATE INDEX "Order_branchId_idx" ON "Order"("branchId");

-- CreateIndex
CREATE INDEX "OfferBanner_branchId_idx" ON "OfferBanner"("branchId");

-- CreateIndex
CREATE INDEX "HeaderOffer_branchId_idx" ON "HeaderOffer"("branchId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferBanner" ADD CONSTRAINT "OfferBanner_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeaderOffer" ADD CONSTRAINT "HeaderOffer_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
