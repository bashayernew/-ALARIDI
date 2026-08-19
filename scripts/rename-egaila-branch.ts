/**
 * Fix the Egaila branch name: "Date Mall" -> "The Gate Mall".
 *
 *   npx tsx scripts/rename-egaila-branch.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const res = await prisma.branch.updateMany({
    where: { name: { contains: "Date Mall", mode: "insensitive" } },
    data: {
      name: "Egaila — The Gate Mall",
      nameAr: "العقيلة - ذا جيت مول",
    },
  });
  console.log(`Renamed ${res.count} branch(es) to "Egaila — The Gate Mall".`);
}

main()
  .catch((e) => {
    console.error("Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
