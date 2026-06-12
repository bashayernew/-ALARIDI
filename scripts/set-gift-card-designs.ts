/**
 * Replace the gift card designs with the branded per-denomination cards
 * (5/10/15/20/25/30 KD), using the /public/{amount}card.jpeg artwork.
 * Non-destructive: only touches gift card products + their occasion links,
 * leaving products, orders, baskets, etc. untouched.
 *
 *   npx tsx scripts/set-gift-card-designs.ts   (or: npm run db:set-gift-cards)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DESIGNS = [5, 10, 15, 20, 25, 30].map((amt, i) => ({
  titleEn: `Al Aridi Gift Card — ${amt} KD`,
  titleAr: `بطاقة هدايا العريضي — ${amt} د.ك`,
  descriptionEn: `A ${amt} KD Al Aridi Sweets gift card — redeemable on any order.`,
  descriptionAr: `بطاقة هدايا حلويات العريضي بقيمة ${amt} د.ك — قابلة للاستخدام على أي طلب.`,
  image: `/${amt}card.jpeg`,
  price: amt,
  presetAmounts: [amt],
  allowCustomAmount: false,
  minCustomAmount: amt,
  maxCustomAmount: amt,
  sortOrder: i,
  enabled: true,
}));

async function main() {
  // Drop links/refs to the old placeholder cards so they can be removed.
  await prisma.giftOccasionGiftCard.deleteMany().catch(() => {});
  await prisma.giftCard
    .updateMany({ data: { giftCardProductId: null } })
    .catch(() => {});
  await prisma.giftCardProduct.deleteMany();

  await prisma.giftCardProduct.createMany({ data: DESIGNS });

  // Re-link every occasion to the 25 KD card so occasion pages still offer a card.
  const card25 = await prisma.giftCardProduct.findFirst({
    where: { titleEn: "Al Aridi Gift Card — 25 KD" },
  });
  if (card25) {
    const occasions = await prisma.giftOccasion.findMany({
      select: { id: true },
    });
    for (const o of occasions) {
      await prisma.giftOccasionGiftCard
        .create({ data: { occasionId: o.id, giftCardProductId: card25.id } })
        .catch(() => {});
    }
  }

  const count = await prisma.giftCardProduct.count();
  console.log(`✅ Gift card designs reset: ${count} branded cards (5–30 KD).`);
}

main()
  .catch((e) => {
    console.error("\n❌ Failed to set gift card designs:\n", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
