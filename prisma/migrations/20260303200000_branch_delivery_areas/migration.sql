-- CreateTable
CREATE TABLE "BranchDeliveryArea" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "governorate" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "deliveryFeeKwd" DECIMAL(10,3) NOT NULL DEFAULT 0,

    CONSTRAINT "BranchDeliveryArea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BranchDeliveryArea_area_idx" ON "BranchDeliveryArea"("area");

-- CreateIndex
CREATE INDEX "BranchDeliveryArea_governorate_area_idx" ON "BranchDeliveryArea"("governorate", "area");

-- CreateIndex
CREATE UNIQUE INDEX "BranchDeliveryArea_branchId_area_key" ON "BranchDeliveryArea"("branchId", "area");

-- AddForeignKey
ALTER TABLE "BranchDeliveryArea" ADD CONSTRAINT "BranchDeliveryArea_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
