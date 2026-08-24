/**
 * One-time backfill after adding Product.sellByWeight:
 * turn weight sizes OFF for products that were previously excluded
 * automatically (Lebanese Moone category, saj / kaake / dibs / gift items).
 * Everything else keeps sellByWeight = true (the new default).
 *
 *   npx tsx scripts/backfill-sell-by-weight.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, slug: true, category: true },
  });

  const toDisable = products.filter((p) => {
    if (p.category === "LEBANESE_MOONE") return true;
    const probe = `${p.slug} ${p.name}`.toLowerCase();
    return (
      probe.includes("saj") ||
      probe.includes("kaake") ||
      probe.includes("dibs") ||
      probe.includes("gift")
    );
  });

  if (toDisable.length === 0) {
    console.log("Nothing to update — all products keep weight sizes.");
    return;
  }

  const res = await prisma.product.updateMany({
    where: { id: { in: toDisable.map((p) => p.id) } },
    data: { sellByWeight: false },
  });
  console.log(`Weight sizes turned OFF for ${res.count} products:`);
  for (const p of toDisable) console.log(` - ${p.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
