/**
 * Retire the "Must Try" category:
 * - move Baklawa Mix into BAKLAVA
 * - delete the duplicate Mafrooke Pistachio (the kashta-sweets one stays)
 * - move any other MUST_TRY leftovers to BAKLAVA, then deactivate the category
 *
 *   npx tsx scripts/remove-must-try.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const mix = await prisma.product.updateMany({
    where: { slug: "mt-baklawa-mix" },
    data: { category: "BAKLAVA" },
  });
  console.log(`Baklawa Mix -> BAKLAVA (${mix.count})`);

  const dup = await prisma.product.findFirst({
    where: { slug: "mt-mafrooke-pistachio" },
  });
  if (dup) {
    try {
      await prisma.product.delete({ where: { id: dup.id } });
      console.log("Deleted duplicate Mafrooke Pistachio (must-try copy)");
    } catch {
      await prisma.product.update({
        where: { id: dup.id },
        data: { isAvailable: false, isBestSeller: false },
      });
      console.log("Hid duplicate Mafrooke Pistachio (referenced by orders)");
    }
  }

  const rest = await prisma.product.updateMany({
    where: { category: "MUST_TRY" },
    data: { category: "BAKLAVA" },
  });
  if (rest.count) console.log(`Moved ${rest.count} other MUST_TRY product(s) to BAKLAVA`);

  const cat = await prisma.category.updateMany({
    where: { key: "MUST_TRY" },
    data: { isActive: false },
  });
  console.log(`Must Try category deactivated (${cat.count})`);
}

main()
  .catch((e) => {
    console.error("Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
