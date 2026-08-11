/**
 * Add the "Zwara" gift occasion (shown as a chip on Shop by occasion).
 *
 *   npx tsx scripts/add-zwara-occasion.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const occasion = await prisma.giftOccasion.upsert({
    where: { slug: "zwara" },
    update: { enabled: true, nameEn: "Zwara", nameAr: "زوارة" },
    create: {
      slug: "zwara",
      nameEn: "Zwara",
      nameAr: "زوارة",
      enabled: true,
      sortOrder: 10,
    },
  });
  console.log(`Zwara occasion ready (${occasion.id}).`);
}

main()
  .catch((e) => {
    console.error("Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
