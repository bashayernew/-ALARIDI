/**
 * Backfill branchId on orders that were created before branch scoping.
 * Assigns the first active branch (by sortOrder) to any order with null branchId.
 *
 *   npm run db:assign-orders-branch
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const branch = await prisma.branch.findFirst({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
  if (!branch) {
    console.log("No active branches — nothing to assign.");
    return;
  }

  const result = await prisma.order.updateMany({
    where: { branchId: null },
    data: { branchId: branch.id },
  });
  console.log(
    `Assigned branch "${branch.name}" (${branch.id}) to ${result.count} order(s).`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
