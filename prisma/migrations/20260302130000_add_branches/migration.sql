-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'BRANCH_ADMIN');

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL DEFAULT '',
    "area" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "role" "AdminRole" NOT NULL DEFAULT 'BRANCH_ADMIN',
    "branchId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchMenuAvailability" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "menuLineId" TEXT NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "priceOverride" DECIMAL(10,3),

    CONSTRAINT "BranchMenuAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Branch_slug_key" ON "Branch"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "AdminUser_branchId_idx" ON "AdminUser"("branchId");

-- CreateIndex
CREATE INDEX "BranchMenuAvailability_branchId_idx" ON "BranchMenuAvailability"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "BranchMenuAvailability_branchId_menuLineId_key" ON "BranchMenuAvailability"("branchId", "menuLineId");

-- AddForeignKey
ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchMenuAvailability" ADD CONSTRAINT "BranchMenuAvailability_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchMenuAvailability" ADD CONSTRAINT "BranchMenuAvailability_menuLineId_fkey" FOREIGN KEY ("menuLineId") REFERENCES "MenuLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
