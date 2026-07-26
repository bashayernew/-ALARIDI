/**
 * Open delivery to EVERY governorate and area in Kuwait with a flat 1 KD fee.
 * Areas already assigned to a branch keep their branch (fee set to 1 KD);
 * unassigned areas are given to the default branch (Salmiya, or the first one).
 *
 *   npx tsx scripts/open-all-delivery-areas.ts
 */
import { PrismaClient } from "@prisma/client";
import { KUWAIT_GOVERNORATES } from "../lib/kuwait-areas";

const prisma = new PrismaClient();
const FEE_KWD = 1;

async function main() {
  const branches = await prisma.branch.findMany({ orderBy: { sortOrder: "asc" } });
  if (branches.length === 0) throw new Error("No branches found.");
  const defaultBranch =
    branches.find((b) => b.name.toLowerCase().includes("salmiya")) ?? branches[0]!;
  console.log(`Default branch for unassigned areas: ${defaultBranch.name}`);

  const existing = await prisma.branchDeliveryArea.findMany();
  const byArea = new Map(existing.map((r) => [r.area, r]));

  let created = 0;
  let updated = 0;
  for (const g of KUWAIT_GOVERNORATES) {
    for (const a of g.areas) {
      const row = byArea.get(a.key);
      if (row) {
        await prisma.branchDeliveryArea.update({
          where: { id: row.id },
          data: { enabled: true, deliveryFeeKwd: FEE_KWD, governorate: g.key },
        });
        updated++;
      } else {
        await prisma.branchDeliveryArea.create({
          data: {
            branchId: defaultBranch.id,
            governorate: g.key,
            area: a.key,
            enabled: true,
            deliveryFeeKwd: FEE_KWD,
          },
        });
        created++;
      }
    }
  }
  console.log(`Done: ${created} areas opened, ${updated} updated - all at ${FEE_KWD} KD.`);
}

main()
  .catch((e) => {
    console.error("Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
