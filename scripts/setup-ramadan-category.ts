/**
 * Create the hidden "Ramadan Sweets" category and move the Ramadan items
 * into it. The category starts INACTIVE (hidden from the storefront);
 * activate it each Ramadan from Admin -> Categories, or rerun with:
 *   ACTIVATE=1 npx tsx scripts/setup-ramadan-category.ts
 *
 *   npx tsx scripts/setup-ramadan-category.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const RAMADAN_SLUGS = [
  "as-katayef-kashta",
  "as-katayef-walnut",
  "as-znood-al-set",
  "as-balah-sham",
  "as-awamat",
];

async function main() {
  const activate = process.env.ACTIVATE === "1";

  await prisma.category.upsert({
    where: { key: "RAMADAN_SWEETS" },
    update: { isActive: activate },
    create: {
      key: "RAMADAN_SWEETS",
      nameEn: "Ramadan Sweets",
      nameAr: "حلويات رمضانية",
      sectionSlug: "ramadan-sweets",
      sortOrder: 12,
      isActive: activate,
    },
  });
  console.log(`Category RAMADAN_SWEETS ready (active: ${activate})`);

  const moved = await prisma.product.updateMany({
    where: { slug: { in: RAMADAN_SLUGS } },
    data: { category: "RAMADAN_SWEETS" },
  });
  console.log(`Moved ${moved.count} product(s) into Ramadan Sweets.`);

  const dibs = await prisma.product.updateMany({
    where: { slug: "dt-dibs" },
    data: { category: "DIET_SWEETS" },
  });
  console.log(`Moved Dibs El Enab to Diet Sweets (${dibs.count}).`);
}

main()
  .catch((e) => {
    console.error("Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
