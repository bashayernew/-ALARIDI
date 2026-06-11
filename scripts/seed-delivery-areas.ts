/**
 * Seed sensible default delivery areas for each branch so customer areas map to
 * the nearest branch (and the storefront shows that branch's menu, prices and
 * fee instead of falling back to the default branch).
 *
 * Mapping (each Kuwait governorate -> nearest branch):
 *   - Hawalli + Mubarak Al-Kabeer -> Salmiya — Qatar Street
 *   - Capital + Farwaniya         -> Kuwait City — Assima Mall
 *   - Jahra                       -> Jahra — Sahari Mall
 *   - Ahmadi                      -> Egaila — Date Mall
 *
 * Fees: 1.000 KWD inside the branch's home governorate, 1.500 KWD for a
 * neighbouring governorate assigned to it. Both are easy to change afterwards
 * in Admin -> Delivery areas.
 *
 * SAFE + NON-DESTRUCTIVE: only CREATES missing (branch, area) rows. If a row
 * already exists (you already configured or edited it), it is left untouched —
 * so re-running never clobbers fees or toggles you set by hand.
 *
 *   npx tsx scripts/seed-delivery-areas.ts   (or: npm run db:seed-delivery-areas)
 */
import { PrismaClient } from "@prisma/client";
import { KUWAIT_GOVERNORATES } from "../lib/kuwait-areas";

const prisma = new PrismaClient();

const HOME_FEE = 1.0;
const NEIGHBOUR_FEE = 1.5;

// governorateKey -> { branchSlug, fee }
const GOVERNORATE_TO_BRANCH: Record<
  string,
  { branchSlug: string; fee: number }
> = {
  hawalli: { branchSlug: "salmiya-qatar-street", fee: HOME_FEE },
  "mubarak-al-kabeer": { branchSlug: "salmiya-qatar-street", fee: NEIGHBOUR_FEE },
  capital: { branchSlug: "kuwait-city-assima", fee: HOME_FEE },
  farwaniya: { branchSlug: "kuwait-city-assima", fee: NEIGHBOUR_FEE },
  jahra: { branchSlug: "jahra-sahari", fee: HOME_FEE },
  ahmadi: { branchSlug: "egaila-date-mall", fee: HOME_FEE },
};

async function main() {
  const branches = await prisma.branch.findMany({
    select: { id: true, slug: true, name: true },
  });
  const branchBySlug = new Map(branches.map((b) => [b.slug, b]));

  if (branches.length === 0) {
    console.error(
      "No branches found. Run `npm run db:seed-branches` first, then re-run this."
    );
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;
  const perBranch: Record<string, number> = {};

  for (const gov of KUWAIT_GOVERNORATES) {
    const mapping = GOVERNORATE_TO_BRANCH[gov.key];
    if (!mapping) {
      console.warn(`No branch mapping for governorate "${gov.key}" — skipping.`);
      continue;
    }
    const branch = branchBySlug.get(mapping.branchSlug);
    if (!branch) {
      console.warn(
        `Branch "${mapping.branchSlug}" not found — skipping ${gov.key}.`
      );
      continue;
    }

    for (const area of gov.areas) {
      const existing = await prisma.branchDeliveryArea.findUnique({
        where: {
          branchId_area: { branchId: branch.id, area: area.key },
        },
        select: { id: true },
      });
      if (existing) {
        skipped++;
        continue;
      }
      await prisma.branchDeliveryArea.create({
        data: {
          branchId: branch.id,
          governorate: gov.key,
          area: area.key,
          enabled: true,
          deliveryFeeKwd: mapping.fee,
        },
      });
      created++;
      perBranch[branch.name] = (perBranch[branch.name] ?? 0) + 1;
    }
  }

  console.log(`\nDelivery areas seeded.`);
  console.log(`  Created: ${created} new area(s)`);
  console.log(`  Skipped: ${skipped} already-configured area(s)`);
  for (const [name, n] of Object.entries(perBranch)) {
    console.log(`    + ${name}: ${n} area(s) enabled`);
  }
  console.log(
    `\nReview or adjust fees anytime in Admin -> Delivery areas (per branch).`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
