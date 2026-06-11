/**
 * Replace the gift cards with six fixed-denomination cards (5/10/15/20/25/30 KD),
 * each using its matching artwork in public/ (e.g. /10card.jpeg), and remove the
 * previous gift cards.
 *
 *   npx tsx scripts/restore-gift-cards.ts   (or: npm run db:restore-gift-cards)
 *
 * Safe: only touches the GiftCardProduct table. Old cards that can't be deleted
 * (because real gift cards were already issued from them) are disabled instead.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const AMOUNTS = [5, 10, 15, 20, 25, 30];

async function main() {
  const keepTitles: string[] = [];

  for (let i = 0; i < AMOUNTS.length; i++) {
    const amount = AMOUNTS[i]!;
    const titleEn = `${amount} KD Gift Card`;
    keepTitles.push(titleEn);

    const data = {
      titleEn,
      titleAr: `بطاقة هدية ${amount} د.ك`,
      descriptionEn: `Al Aridi Sweets gift card worth ${amount} KD — redeemable on any order.`,
      descriptionAr: `بطاقة هدية حلويات العريضي بقيمة ${amount} دينار — قابلة للاستخدام على أي طلب.`,
      image: `/${amount}card.jpeg`,
      price: amount,
      allowCustomAmount: false,
      presetAmounts: [amount],
      minCustomAmount: null,
      maxCustomAmount: null,
      enabled: true,
      sortOrder: i,
    };

    const existing = await prisma.giftCardProduct.findFirst({
      where: { titleEn },
    });
    if (existing) {
      await prisma.giftCardProduct.update({ where: { id: existing.id }, data });
    } else {
      await prisma.giftCardProduct.create({ data });
    }
  }

  // Remove the previous gift cards (anything that isn't one of the six).
  const old = await prisma.giftCardProduct.findMany({
    where: { titleEn: { notIn: keepTitles } },
  });
  let deleted = 0;
  let disabled = 0;
  for (const o of old) {
    try {
      await prisma.giftCardProduct.delete({ where: { id: o.id } });
      deleted++;
    } catch {
      // Has issued gift cards / order history — hide it instead of deleting.
      await prisma.giftCardProduct.update({
        where: { id: o.id },
        data: { enabled: false },
      });
      disabled++;
    }
  }

  console.log(
    `\n✅ Gift cards updated: ${AMOUNTS.length} denomination cards (${AMOUNTS.join(
      ", "
    )} KD).\n` +
      `   Previous cards removed: ${deleted} deleted, ${disabled} disabled.\n`
  );
}

main()
  .catch((e) => {
    console.error("\n❌ Failed to update gift cards:\n", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
