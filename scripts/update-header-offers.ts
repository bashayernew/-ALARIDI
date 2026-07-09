/**
 * Rename the "Ramadan gift bundles available" feature-strip card
 * to "Gift Bundles Available".
 *
 *   npx tsx scripts/update-header-offers.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const offers = await prisma.headerOffer.findMany({
    where: { titleEn: { contains: "gift bundle", mode: "insensitive" } },
  });
  for (const o of offers) {
    await prisma.headerOffer.update({
      where: { id: o.id },
      data: {
        titleEn: "Gift Bundles Available",
        titleAr: "بوكسات هدايا متوفرة",
      },
    });
    console.log(`OK "${o.titleEn}" -> "Gift Bundles Available"`);
  }
  console.log(`Done: ${offers.length} offer(s) updated.`);
}

main()
  .catch((e) => {
    console.error("Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
