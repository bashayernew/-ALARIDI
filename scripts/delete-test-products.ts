/**
 * Delete leftover test products by exact name.
 * If a product can't be deleted (it's referenced by past orders),
 * it is hidden from the storefront instead (isAvailable = false).
 *
 *   npx tsx scripts/delete-test-products.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NAMES = ["test", "test2", "Bashayer", "ssd"];

async function main() {
  for (const name of NAMES) {
    const products = await prisma.product.findMany({
      where: { name: { equals: name, mode: "insensitive" } },
    });
    if (products.length === 0) {
      console.log(`- "${name}": not found (already removed?)`);
      continue;
    }
    for (const p of products) {
      try {
        await prisma.product.delete({ where: { id: p.id } });
        console.log(`OK deleted "${p.name}" (${p.id})`);
      } catch {
        await prisma.product.update({
          where: { id: p.id },
          data: { isAvailable: false },
        });
        console.log(
          `! "${p.name}" is referenced by orders — hidden from the store instead.`
        );
      }
    }
  }
}

main()
  .catch((e) => {
    console.error("Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
