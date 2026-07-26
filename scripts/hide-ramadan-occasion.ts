/**
 * Hide the "Ramadan" occasion chip from the gifts page (Shop by occasion).
 * Re-enable it each Ramadan from Admin -> Occasions, or rerun with ACTIVATE=1.
 *
 *   npx tsx scripts/hide-ramadan-occasion.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const activate = process.env.ACTIVATE === "1";
  const res = await prisma.giftOccasion.updateMany({
    where: { nameEn: { contains: "ramadan", mode: "insensitive" } },
    data: { enabled: activate },
  });
  console.log(`Ramadan occasion ${activate ? "enabled" : "hidden"} (${res.count}).`);
}

main()
  .catch((e) => {
    console.error("Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
