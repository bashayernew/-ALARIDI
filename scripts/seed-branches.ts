/**
 * Seed the 4 Al Aridi Sweets branches and ensure a super-admin account exists.
 *
 * Safe + non-destructive: branches are upserted by slug and the super-admin is
 * only created if missing. It does NOT touch products, orders, or customers.
 *
 *   npx tsx scripts/seed-branches.ts   (or: npm run db:seed-branches)
 */
import { PrismaClient } from "@prisma/client";
import { BRANCH_SEED } from "../lib/branches";
import { hashPassword } from "../lib/admin-password";
import {
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD,
} from "../lib/admin-config";

const prisma = new PrismaClient();

async function main() {
  for (let i = 0; i < BRANCH_SEED.length; i++) {
    const b = BRANCH_SEED[i]!;
    await prisma.branch.upsert({
      where: { slug: b.slug },
      update: {
        name: b.name,
        nameAr: b.nameAr,
        area: b.area,
        sortOrder: i,
        active: true,
      },
      create: {
        slug: b.slug,
        name: b.name,
        nameAr: b.nameAr,
        area: b.area,
        sortOrder: i,
        active: true,
      },
    });
  }

  const email = (process.env.ADMIN_EMAIL?.trim() || DEFAULT_ADMIN_EMAIL).toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (!existing) {
    await prisma.adminUser.create({
      data: {
        email,
        name: "Super Admin",
        passwordHash: hashPassword(password),
        role: "SUPER_ADMIN",
        branchId: null,
      },
    });
    console.log(`\n✅ Super-admin account created: ${email}`);
  } else {
    console.log(`\nℹ️  Super-admin account already exists: ${email}`);
  }

  console.log(
    `✅ Branches seeded: ${BRANCH_SEED.length} (${BRANCH_SEED.map((b) => b.name).join(", ")}).\n`
  );
}

main()
  .catch((e) => {
    console.error("\n❌ Failed to seed branches:\n", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
