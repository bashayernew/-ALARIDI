/**
 * Import the full menu catalog (lib/menu-data.ts) into the Product table so every
 * menu item is a real product — it then shows on /menu, in Branch availability,
 * and can be ordered. Safe + idempotent: upserts by a stable id, so re-running
 * won't create duplicates. Existing products are left untouched.
 *
 *   npx tsx scripts/import-menu-to-products.ts   (or: npm run db:import-menu-products)
 */
import { PrismaClient } from "@prisma/client";
import { MENU_SECTIONS } from "../lib/menu-data";
import { MENU_PRODUCT_AR } from "../lib/menu-product-ar";
import { CATEGORY_SECTION_SLUG } from "../lib/categories";

const prisma = new PrismaClient();

// Reverse the category → slug map to get slug → category key.
const SLUG_TO_CATEGORY = Object.fromEntries(
  Object.entries(CATEGORY_SECTION_SLUG).map(([cat, slug]) => [slug, cat])
) as Record<string, string>;

async function main() {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const section of MENU_SECTIONS) {
    const category = SLUG_TO_CATEGORY[section.slug];
    if (!category) {
      console.warn(`! Unknown section slug "${section.slug}" — skipping.`);
      skipped += section.products.length;
      continue;
    }

    for (const p of section.products) {
      const ar = MENU_PRODUCT_AR[p.id];
      const data = {
        slug: p.id,
        name: p.name,
        nameAr: ar?.name ?? "",
        description: p.description,
        descriptionAr: ar?.description ?? "",
        price: p.price,
        oldPrice: p.oldPrice ?? null,
        image: p.image,
        images: [p.image],
        category,
        isBestSeller: Boolean(p.bestSeller),
        isPromo: Boolean(p.promo || p.oldPrice),
        isCustomizable: Boolean(p.customizable),
        isAvailable: true,
        isNew: Boolean(p.isNew),
      };

      const existing = await prisma.product.findUnique({ where: { id: p.id } });
      if (existing) {
        await prisma.product.update({ where: { id: p.id }, data });
        updated++;
      } else {
        await prisma.product.create({ data: { id: p.id, ...data } });
        created++;
      }
    }
  }

  console.log(
    `\n✅ Menu imported into products: ${created} created, ${updated} updated` +
      (skipped ? `, ${skipped} skipped` : "") +
      `.\n   They now appear under Products and Branch availability.\n`
  );
}

main()
  .catch((e) => {
    console.error("\n❌ Failed to import menu into products:\n", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
