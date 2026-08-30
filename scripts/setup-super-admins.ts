/**
 * Create / update the two SUPER_ADMIN dashboard accounts.
 * Passwords come from the command environment so they are not stored in git:
 *
 *   $env:ADMIN1_EMAIL="..."; $env:ADMIN1_PASS="..."
 *   $env:ADMIN2_EMAIL="..."; $env:ADMIN2_PASS="..."
 *   npx tsx scripts/setup-super-admins.ts
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/admin-password";

const prisma = new PrismaClient();

async function upsertSuperAdmin(email: string, password: string, name: string) {
  const passwordHash = hashPassword(password);
  await prisma.adminUser.upsert({
    where: { email: email.toLowerCase() },
    update: {
      passwordHash,
      role: "SUPER_ADMIN",
      active: true,
      branchId: null,
      name,
    },
    create: {
      email: email.toLowerCase(),
      passwordHash,
      role: "SUPER_ADMIN",
      active: true,
      name,
    },
  });
  console.log(`SUPER_ADMIN ready: ${email}`);
}

async function main() {
  const pairs: [string | undefined, string | undefined, string][] = [
    [process.env.ADMIN1_EMAIL, process.env.ADMIN1_PASS, "Al Aridi Admin"],
    [process.env.ADMIN2_EMAIL, process.env.ADMIN2_PASS, "Backup Admin"],
  ];
  let count = 0;
  for (const [email, pass, name] of pairs) {
    if (email?.trim() && pass?.trim()) {
      await upsertSuperAdmin(email.trim(), pass, name);
      count += 1;
    }
  }
  if (count === 0) {
    console.log("Nothing to do — set ADMIN1_EMAIL/ADMIN1_PASS (and optionally ADMIN2_*).");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
