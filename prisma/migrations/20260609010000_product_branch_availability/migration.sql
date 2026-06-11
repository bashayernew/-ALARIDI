-- Retarget branch availability from MenuLine to Product; drop legacy menu tables.

DROP TABLE IF EXISTS "BranchMenuAvailability";

CREATE TABLE "BranchProductAvailability" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "priceOverride" DECIMAL(10,3),

    CONSTRAINT "BranchProductAvailability_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BranchProductAvailability_branchId_productId_key" ON "BranchProductAvailability"("branchId", "productId");
CREATE INDEX "BranchProductAvailability_branchId_idx" ON "BranchProductAvailability"("branchId");
CREATE INDEX "BranchProductAvailability_productId_idx" ON "BranchProductAvailability"("productId");

ALTER TABLE "BranchProductAvailability" ADD CONSTRAINT "BranchProductAvailability_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BranchProductAvailability" ADD CONSTRAINT "BranchProductAvailability_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP TABLE IF EXISTS "MenuLine";
DROP TABLE IF EXISTS "MenuCategoryConfig";
