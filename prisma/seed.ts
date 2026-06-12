import {
  GiftBasketPricingMode,
  GiftBasketVisibility,
  HeaderOfferPlacement,
  PrismaClient,
} from "@prisma/client";
import { DEFAULT_LOYALTY_SETTINGS } from "../lib/loyalty-settings";
import { FALLBACK_CATEGORIES } from "../lib/categories";

const prisma = new PrismaClient();

const photos = [
  "1558961363-fa8fdf82db35",
  "1464349095431-e9a21285b5f3",
  "1488477181946-6428a0291777",
  "1563805042-7684c019e1c6",
  "1578985545061-4025fef258a8",
  "1499636136210-6cde91586bbf",
  "1504674900247-0877dfc7c672",
  "1562440349-10c3b023daab",
].map(
  (id) =>
    `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`
);

function pick(i: number) {
  return photos[i % photos.length]!;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .slice(0, 80);
}

async function main() {
  // Wipe order-item-style tables first to respect FK constraints.
  await prisma.loyaltyPointLot.deleteMany().catch(() => {});
  await prisma.loyaltyRedemptionCode.deleteMany().catch(() => {});
  await prisma.loyaltyTxn.deleteMany().catch(() => {});
  await prisma.giftCardTxn.deleteMany().catch(() => {});
  await prisma.review.deleteMany().catch(() => {});
  await prisma.wishlistItem.deleteMany().catch(() => {});
  await prisma.rewardRedemption.deleteMany().catch(() => {});
  await prisma.orderItem.deleteMany();
  await prisma.orderGiftCardItem.deleteMany().catch(() => {});
  await prisma.orderGiftBasketItem.deleteMany().catch(() => {});
  await prisma.order.deleteMany();
  await prisma.giftBasketItem.deleteMany().catch(() => {});
  await prisma.giftOccasionGiftCard.deleteMany().catch(() => {});
  await prisma.giftOccasionBasket.deleteMany().catch(() => {});
  await prisma.giftOccasion.deleteMany().catch(() => {});
  await prisma.giftBasket.deleteMany().catch(() => {});
  await prisma.giftCard.deleteMany().catch(() => {});
  await prisma.giftCardProduct.deleteMany().catch(() => {});
  await prisma.customerSession.deleteMany().catch(() => {});
  await prisma.customerAddress.deleteMany().catch(() => {});
  await prisma.customer.deleteMany().catch(() => {});
  await prisma.contactSubmission.deleteMany().catch(() => {});
  await prisma.newsletterSubscriber.deleteMany().catch(() => {});
  await prisma.blogPost.deleteMany().catch(() => {});
  await prisma.branchProductAvailability.deleteMany().catch(() => {});
  await prisma.siteContent.deleteMany();
  await prisma.promoCode.deleteMany();
  await prisma.offerBanner.deleteMany();
  await prisma.headerOffer.deleteMany();
  await prisma.product.deleteMany();

  await prisma.loyaltySettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...DEFAULT_LOYALTY_SETTINGS },
    update: DEFAULT_LOYALTY_SETTINGS,
  });

  // Seed the built-in product categories (idempotent).
  for (const c of FALLBACK_CATEGORIES) {
    await prisma.category.upsert({
      where: { key: c.key },
      create: {
        id: c.id,
        key: c.key,
        nameEn: c.nameEn,
        nameAr: c.nameAr,
        sectionSlug: c.sectionSlug,
        sortOrder: c.sortOrder,
        isActive: c.isActive,
      },
      update: {
        nameEn: c.nameEn,
        nameAr: c.nameAr,
        sectionSlug: c.sectionSlug,
        sortOrder: c.sortOrder,
      },
    });
  }

  const rows = [
    {
      name: "Signature Pistachio Kunafa",
      description:
        "Crisp kataifi, premium kashta, roasted pistachio — our house favorite.",
      price: 4.5,
      oldPrice: null as number | null,
      category: "MUST_TRY",
      isBestSeller: true,
      isPromo: false,
      isCustomizable: true,
    },
    {
      name: "Warbat Assorted Tray",
      description:
        "Layers of crisp pastry with kashta and light syrup — gift-ready.",
      price: 12,
      oldPrice: 14,
      category: "PROMO",
      isBestSeller: false,
      isPromo: true,
      isCustomizable: false,
    },
    {
      name: "Classic Cheese Kunafa",
      description:
        "Golden pull, sweet cheese center, orange blossom syrup on the side.",
      price: 3.75,
      oldPrice: null,
      category: "KUNAFA",
      isBestSeller: true,
      isPromo: false,
      isCustomizable: true,
    },
    {
      name: "Chocolate Kunafa Roll",
      description:
        "Dark chocolate drizzle, crushed nuts — best enjoyed warm.",
      price: 4.25,
      oldPrice: null,
      category: "KUNAFA",
      isBestSeller: false,
      isPromo: false,
      isCustomizable: true,
    },
    {
      name: "Maamoul Date Selection",
      description: "Hand-pressed semolina shells, slow-cooked date filling.",
      price: 6.5,
      oldPrice: null,
      category: "BAKERY",
      isBestSeller: false,
      isPromo: false,
      isCustomizable: false,
    },
    {
      name: "Kaak Sesame Rings",
      description: "Levantine bakery classic — light, aromatic, perfect with tea.",
      price: 2.5,
      oldPrice: null,
      category: "BAKERY",
      isBestSeller: false,
      isPromo: false,
      isCustomizable: false,
    },
    {
      name: "Royal Baklava Mix",
      description: "Pistachio and cashew cuts, clarified butter, light attar.",
      price: 18,
      oldPrice: 22,
      category: "BAKLAVA",
      isBestSeller: true,
      isPromo: true,
      isCustomizable: false,
    },
    {
      name: "Bourek Ashta",
      description: "Flaky phyllo cigars filled with scented kashta cream.",
      price: 5.25,
      oldPrice: null,
      category: "BASMAH",
      isBestSeller: false,
      isPromo: false,
      isCustomizable: false,
    },
    {
      name: "Walnut Maamoul",
      description: "Toasted walnut, orange blossom, delicate dusting of sugar.",
      price: 7,
      oldPrice: null,
      category: "MAAMOUL",
      isBestSeller: false,
      isPromo: false,
      isCustomizable: false,
    },
    {
      name: "Pistachio Ghraybe",
      description: "Meltaway shortbread, Iranian pistachio, minimal sweetness.",
      price: 8.5,
      oldPrice: null,
      category: "GHRAYBE",
      isBestSeller: false,
      isPromo: false,
      isCustomizable: false,
    },
    {
      name: "Aish El Saraya Cup",
      description: "Caramelized crumbs, kashta cloud, pistachio crown.",
      price: 3.5,
      oldPrice: null,
      category: "KASHTA_SWEETS",
      isBestSeller: false,
      isPromo: false,
      isCustomizable: true,
    },
    {
      name: "Mixed Petit Four Box",
      description: "Chef’s daily assortment — ideal for gifting.",
      price: 15,
      oldPrice: null,
      category: "ASSORTED_SWEETS",
      isBestSeller: true,
      isPromo: false,
      isCustomizable: true,
    },
    {
      name: "Sugar-Free Almond Bar",
      description: "Stevia-sweetened, roasted almond, dark chocolate base.",
      price: 5,
      oldPrice: null,
      category: "DIET_SWEETS",
      isBestSeller: false,
      isPromo: false,
      isCustomizable: false,
    },
    {
      name: "Akkawi Labneh Jar",
      description: "Strained yogurt, olive oil pool, za’atar pinch.",
      price: 3.25,
      oldPrice: null,
      category: "LEBANESE_MOONE",
      isBestSeller: false,
      isPromo: false,
      isCustomizable: false,
    },
    {
      name: "Kalamata Olives Marinated",
      description: "Herbs, lemon zest, extra virgin olive oil.",
      price: 2.75,
      oldPrice: 3.25,
      category: "LEBANESE_MOONE",
      isBestSeller: false,
      isPromo: true,
      isCustomizable: false,
    },
    {
      name: "Promo: Kunafa + Drink",
      description: "Cheese kunafa portion with house jallab or lemonade.",
      price: 5.5,
      oldPrice: 7,
      category: "PROMO",
      isBestSeller: false,
      isPromo: true,
      isCustomizable: false,
    },
    {
      name: "Mafrooke Pistachio",
      description:
        "Signature semolina-butter crumble with kashta and pistachio silk.",
      price: 6.25,
      oldPrice: null,
      category: "ASSORTED_SWEETS",
      isBestSeller: true,
      isPromo: false,
      isCustomizable: true,
    },
  ];

  await prisma.product.createMany({
    data: rows.map((r, i) => ({
      ...r,
      slug: slugify(r.name),
      image: pick(i),
    })),
  });

  // Single test promo code. Add more from the admin → Promo codes screen.
  await prisma.promoCode.createMany({
    data: [
      {
        code: "WELCOME10",
        description: "10% off your first order",
        discountType: "PERCENT",
        discountValue: 10,
        minOrderAmount: 5,
        maxUsesPerCustomer: 1,
        isPublic: true,
        enabled: true,
      },
    ],
  });

  await prisma.blogPost.createMany({
    data: [
      {
        slug: "how-we-make-kunafa",
        titleEn: "How we make our signature kunafa",
        titleAr: "كيف نُحضّر كنافتنا المميزة",
        excerptEn:
          "A look inside the kitchen — kataifi, kashta, pistachio, and the timing that makes it sing.",
        excerptAr:
          "نظرة داخل المطبخ — كتايف، قشطة، فستق، والتوقيت الذي يصنع الفرق.",
        bodyEn:
          "Our kunafa starts with kataifi shredded fresh each morning...\n\n(Replace this body with the full article.)",
        bodyAr:
          "تبدأ كنافتنا بشعيرية الكتايف الطازجة كل صباح...\n\n(يرجى استبدال هذا النص بالمقال الكامل.)",
        image: photos[0]!,
        tag: "Recipes",
        published: true,
      },
      {
        slug: "ramadan-gifting-guide",
        titleEn: "Ramadan gifting guide",
        titleAr: "دليل هدايا رمضان",
        excerptEn:
          "Five gift boxes that always land — for family, neighbors, and the office.",
        excerptAr: "خمس علب هدايا تُحدث الفرق — للعائلة والجيران والمكتب.",
        bodyEn:
          "Whether you’re shopping for one or fifty, here are our most-requested trays during Ramadan...",
        bodyAr:
          "سواء كنت تشتري هدية واحدة أو خمسين، هذه أكثر الصواني طلباً خلال رمضان...",
        image: photos[1]!,
        tag: "Gifting",
        published: true,
      },
    ],
  });

  const catalog = await prisma.product.findMany({
    select: { id: true, slug: true },
  });
  const pid = (slug: string) => {
    const row = catalog.find((p) => p.slug === slug);
    if (!row) throw new Error(`Missing product slug: ${slug}`);
    return row.id;
  };

  await prisma.giftBasket.create({
    data: {
      slug: "royal-baklava-kunafa-basket",
      nameEn: "Royal Baklava & Kunafa Basket",
      nameAr: "سلة خليط البaclava والكنافة الملكية",
      descriptionEn:
        "Our bestseller tray — royal baklava mix, classic cheese kunafa, and petit fours.",
      descriptionAr: "صينيتنا الأكثر طلباً — باكلava ملكي، كنافة جبن، ومعمول متنوع.",
      image: "/mixedbaklawa.jpg",
      pricingMode: GiftBasketPricingMode.AUTO,
      visibility: GiftBasketVisibility.PUBLISHED,
      sortOrder: 0,
      isFeatured: true,
      isBestSeller: true,
      includeGiftWrap: true,
      items: {
        create: [
          { productId: pid("royal-baklava-mix"), quantity: 1, sortOrder: 0 },
          { productId: pid("classic-cheese-kunafa"), quantity: 1, sortOrder: 1 },
          { productId: pid("mixed-petit-four-box"), quantity: 1, sortOrder: 2 },
        ],
      },
    },
  });

  await prisma.giftBasket.create({
    data: {
      slug: "eid-celebration-basket",
      nameEn: "Eid Celebration Basket",
      nameAr: "سلة احتفال العيد",
      descriptionEn: "Warbat assorted tray with maamoul date selection — ready to gift.",
      descriptionAr: "صينية ورقات متنوعة مع معمول تمر — جاهزة للإهداء.",
      image: "/assorted.jpg",
      pricingMode: GiftBasketPricingMode.MANUAL,
      manualPrice: 16.5,
      visibility: GiftBasketVisibility.PUBLISHED,
      sortOrder: 1,
      isSeasonal: true,
      includeGiftWrap: true,
      items: {
        create: [
          { productId: pid("warbat-assorted-tray"), quantity: 1, sortOrder: 0 },
          { productId: pid("maamoul-date-selection"), quantity: 1, sortOrder: 1 },
        ],
      },
    },
  });

  await prisma.giftBasket.create({
    data: {
      slug: "sweet-starter-box",
      nameEn: "Sweet Starter Box",
      nameAr: "صندوق البداية الحلو",
      descriptionEn: "A curated intro to Al Aridi — kunafa, ghraybe, and kaak rings.",
      descriptionAr: "تشكيلة تعريفية بكنافة وغريبة وكعك — مثالية كهدية أولى.",
      image: "/kunafa.jpg",
      pricingMode: GiftBasketPricingMode.AUTO,
      visibility: GiftBasketVisibility.PUBLISHED,
      sortOrder: 2,
      isNew: true,
      includeGiftWrap: true,
      items: {
        create: [
          { productId: pid("signature-pistachio-kunafa"), quantity: 1, sortOrder: 0 },
          { productId: pid("pistachio-ghraybe"), quantity: 1, sortOrder: 1 },
          { productId: pid("kaak-sesame-rings"), quantity: 2, sortOrder: 2 },
        ],
      },
    },
  });

  // Branded gift card designs — one per denomination (image under /public).
  await prisma.giftCardProduct.createMany({
    data: [5, 10, 15, 20, 25, 30].map((amt, i) => ({
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
    })),
  });

  const basketRows = await prisma.giftBasket.findMany({
    select: { id: true, slug: true },
  });
  const cardRows = await prisma.giftCardProduct.findMany({
    select: { id: true, titleEn: true },
  });
  const basketId = (slug: string) => {
    const row = basketRows.find((b) => b.slug === slug);
    if (!row) throw new Error(`Missing basket slug: ${slug}`);
    return row.id;
  };
  const cardId = (titleEn: string) => {
    const row = cardRows.find((c) => c.titleEn === titleEn);
    if (!row) throw new Error(`Missing gift card: ${titleEn}`);
    return row.id;
  };

  await prisma.giftOccasion.create({
    data: {
      slug: "eid",
      nameEn: "Eid",
      nameAr: "العيد",
      enabled: true,
      sortOrder: 0,
      giftBaskets: {
        create: [
          { giftBasketId: basketId("eid-celebration-basket") },
          { giftBasketId: basketId("royal-baklava-kunafa-basket") },
        ],
      },
      giftCards: {
        create: [{ giftCardProductId: cardId("Al Aridi Gift Card — 25 KD") }],
      },
    },
  });

  await prisma.giftOccasion.create({
    data: {
      slug: "ramadan",
      nameEn: "Ramadan",
      nameAr: "رمضان",
      enabled: true,
      sortOrder: 1,
      giftBaskets: {
        create: [{ giftBasketId: basketId("royal-baklava-kunafa-basket") }],
      },
      giftCards: {
        create: [{ giftCardProductId: cardId("Al Aridi Gift Card — 10 KD") }],
      },
    },
  });

  await prisma.giftOccasion.create({
    data: {
      slug: "birthdays",
      nameEn: "Birthdays",
      nameAr: "أعياد الميلاد",
      enabled: true,
      sortOrder: 2,
      giftBaskets: {
        create: [{ giftBasketId: basketId("sweet-starter-box") }],
      },
      giftCards: {
        create: [{ giftCardProductId: cardId("Al Aridi Gift Card — 10 KD") }],
      },
    },
  });

  await prisma.giftOccasion.create({
    data: {
      slug: "weddings",
      nameEn: "Weddings",
      nameAr: "الأعراس",
      enabled: true,
      sortOrder: 3,
      giftBaskets: {
        create: [{ giftBasketId: basketId("royal-baklava-kunafa-basket") }],
      },
      giftCards: {
        create: [{ giftCardProductId: cardId("Al Aridi Gift Card — 30 KD") }],
      },
    },
  });

  await prisma.headerOffer.createMany({
    data: [
      {
        titleEn: "Free delivery over 25 KD",
        titleAr: "توصيل مجاني فوق ٢٥ د.ك",
        shortTextEn: "On qualifying orders across Kuwait",
        shortTextAr: "على الطلبات المؤهلة في الكويت",
        icon: "truck",
        ctaTextEn: "Order now",
        ctaTextAr: "اطلب الآن",
        ctaLink: "/menu",
        placement: HeaderOfferPlacement.TOP_ANNOUNCEMENT,
        sortOrder: 0,
        enabled: true,
      },
      {
        titleEn: "Freshly made daily",
        titleAr: "يُحضَّر طازجاً يومياً",
        shortTextEn: "Baked and assembled in our kitchen",
        shortTextAr: "يُخبز ويُجهَّز في مطبخنا",
        icon: "sparkles",
        ctaTextEn: "Explore menu",
        ctaTextAr: "استكشف القائمة",
        ctaLink: "/menu",
        placement: HeaderOfferPlacement.HERO_BADGE,
        sortOrder: 0,
        enabled: true,
      },
      {
        titleEn: "Delivered across Kuwait",
        titleAr: "توصيل في جميع أنحاء الكويت",
        shortTextEn: "Careful packaging, on-time arrival",
        shortTextAr: "تغليف فاخر ووصول في الوقت",
        icon: "map-pin",
        ctaTextEn: "",
        ctaTextAr: "",
        ctaLink: "",
        placement: HeaderOfferPlacement.FEATURE_STRIP,
        sortOrder: 0,
        enabled: true,
      },
      {
        titleEn: "Ramadan gift bundles available",
        titleAr: "باقات هدايا رمضان متوفرة",
        shortTextEn: "Curated trays for family & guests",
        shortTextAr: "صواني مختارة للعائلة والضيوف",
        icon: "gift",
        ctaTextEn: "Shop gifts",
        ctaTextAr: "تسوّق الهدايا",
        ctaLink: "/gifts",
        placement: HeaderOfferPlacement.FEATURE_STRIP,
        sortOrder: 1,
        enabled: true,
      },
    ],
  });

  console.log(
    `Seeded ${rows.length} products, 3 gift baskets, 4 occasions, 4 header offers, promo codes, blog posts, and gift card designs.`
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
