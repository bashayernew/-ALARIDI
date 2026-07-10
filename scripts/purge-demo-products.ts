/**
 * Remove ALL demo/sample products that are not on the real Al Aridi menu.
 * Products referenced by past orders can't be deleted; those are hidden
 * from the storefront instead (isAvailable = false).
 *
 *   npx tsx scripts/purge-demo-products.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_NAMES = [
  // seeded demo products
  "Signature Pistachio Kunafa", "Warbat Assorted Tray", "Classic Cheese Kunafa",
  "Chocolate Kunafa Roll", "Maamoul Date Selection", "Kaak Sesame Rings",
  "Royal Baklava Mix", "Bourek Ashta", "Walnut Maamoul", "Pistachio Ghraybe",
  "Aish El Saraya Cup", "Mixed Petit Four Box", "Sugar-Free Almond Bar",
  "Akkawi Labneh Jar", "Kalamata Olives Marinated", "Promo: Kunafa + Drink",
  // placeholder catalog extras not on the real menu
  "Lebanese Saj Bread", "Kaake Kunafa", "Kunafa", "Mixed Baklawa",
  "Mixed Baklawa Crystal Plate", "Maamoul Dates 250g", "Vanilla Petit Fours",
  "Assorted Diet Sweets Box", "Assorted Diet Sweets Box 1KG",
  "Oat Meal Cookies", "Maakaron",
  // discontinued products
  "Maamoul Walnuts & Chocolate", "Maha Eyes with Chocolate", "Barazek Chocolate",
  // test items
  "test", "test2", "test cat", "Bashayer",
].map((n) => n.toLowerCase());

// Same name as a real product, so only the seed copy (by slug) is removed.
const DEMO_SLUGS = ["mafrooke-pistachio"];

async function main() {
  const products = await prisma.product.findMany();
  let deleted = 0, hidden = 0;

  for (const p of products) {
    const isDemo =
      DEMO_NAMES.includes(p.name.trim().toLowerCase()) ||
      DEMO_SLUGS.includes(p.slug);
    if (!isDemo) continue;
    try {
      await prisma.product.delete({ where: { id: p.id } });
      console.log(`DELETED  ${p.name} (${p.slug})`);
      deleted++;
    } catch {
      await prisma.product.update({
        where: { id: p.id },
        data: { isAvailable: false, isBestSeller: false, isPromo: false },
      });
      console.log(`HIDDEN   ${p.name} (referenced by orders)`);
      hidden++;
    }
  }
  console.log(`\nDone: ${deleted} deleted, ${hidden} hidden.`);
}

main()
  .catch((e) => {
    console.error("Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
