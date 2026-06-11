-- Convert fixed ProductCategory enum into a dynamic Category table.

-- 1. New Category table
CREATE TABLE "Category" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "nameEn" TEXT NOT NULL,
  "nameAr" TEXT NOT NULL DEFAULT '',
  "sectionSlug" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Category_key_key" ON "Category"("key");
CREATE UNIQUE INDEX "Category_sectionSlug_key" ON "Category"("sectionSlug");
CREATE INDEX "Category_isActive_sortOrder_idx" ON "Category"("isActive", "sortOrder");

-- 2. Seed the 12 existing categories (keys match the old enum members)
INSERT INTO "Category" ("id","key","nameEn","nameAr","sectionSlug","sortOrder","isActive","updatedAt") VALUES
  ('cat_must_try',        'MUST_TRY',        'Must Try',        'تجربة لازم',   'must-try',        0,  true, CURRENT_TIMESTAMP),
  ('cat_promo',           'PROMO',           'Promo Items',     'عروض',         'promo-items',     1,  true, CURRENT_TIMESTAMP),
  ('cat_kunafa',          'KUNAFA',          'Kunafa',          'كنافة',        'kunafa',          2,  true, CURRENT_TIMESTAMP),
  ('cat_bakery',          'BAKERY',          'Bakery',          'مخبوزات',      'bakery',          3,  true, CURRENT_TIMESTAMP),
  ('cat_baklava',         'BAKLAVA',         'Baklava',         'بقلاوة',       'baklava',         4,  true, CURRENT_TIMESTAMP),
  ('cat_basmah',          'BASMAH',          'Basmah',          'بسمة',         'basmah',          5,  true, CURRENT_TIMESTAMP),
  ('cat_maamoul',         'MAAMOUL',         'Maamoul',         'معمول',        'maamoul',         6,  true, CURRENT_TIMESTAMP),
  ('cat_ghraybe',         'GHRAYBE',         'Ghraybe',         'غريبة',        'ghraybe',         7,  true, CURRENT_TIMESTAMP),
  ('cat_kashta_sweets',   'KASHTA_SWEETS',   'Kashta Sweets',   'حلويات قشطة',  'kashta-sweets',   8,  true, CURRENT_TIMESTAMP),
  ('cat_assorted_sweets', 'ASSORTED_SWEETS', 'Assorted Sweets', 'حلويات مشكلة', 'assorted-sweets', 9,  true, CURRENT_TIMESTAMP),
  ('cat_diet_sweets',     'DIET_SWEETS',     'Diet Sweets',     'حلويات دايت',  'diet-sweets',     10, true, CURRENT_TIMESTAMP),
  ('cat_lebanese_moone',  'LEBANESE_MOONE',  'Lebanese Moone',  'مونة لبنانية', 'lebanese-moone',  11, true, CURRENT_TIMESTAMP);

-- 3. Convert enum columns to TEXT (enum members cast to their string names, e.g. 'KUNAFA')
ALTER TABLE "Product" ALTER COLUMN "category" TYPE TEXT USING "category"::text;
ALTER TABLE "PromoCodeCategory" ALTER COLUMN "category" TYPE TEXT USING "category"::text;

-- 4. Drop the now-unused enum type
DROP TYPE "ProductCategory";
