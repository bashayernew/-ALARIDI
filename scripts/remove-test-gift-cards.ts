/**
 * Remove test/duplicate gift cards. Keeps only the standard cards whose
 * artwork is /5card.jpeg, /10card.jpeg, etc. Cards that can't be deleted
 * (real gift cards already issued from them) are disabled instead.
 *
 *   npx tsx scripts/remove-test-gift-cards.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const cards = await prisma.giftCardProduct.findMany();
  let removed = 0;

  for (const c of cards) {
    const standard = /^\/\d+card\.jpe?g$/i.test(c.image);
    if (standard) continue;
    try {
      await prisma.giftCardProduct.delete({ where: { id: c.id } });
      console.log(`DELETED  "${c.titleEn}" (image: ${c.image.slice(0, 60)})`);
    } catch {
      await prisma.giftCardProduct.update({
        where: { id: c.id },
        data: { enabled: false },
      });
      console.log(`DISABLED "${c.titleEn}" (has issued cards)`);
    }
    removed++;
  }
  console.log(`\nDone: ${removed} non-standard gift card(s) removed/disabled.`);
}

main()
  .catch((e) => {
    console.error("Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
