import {
  GiftBasketPricingMode,
  GiftBasketVisibility,
  type GiftBasket,
  type GiftBasketItem,
  type Product,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dbQuery } from "@/lib/db-safe";
import { GIFT_WRAP_FEE_KWD } from "@/lib/pricing";
import type { Locale } from "@/lib/i18n";
import { getActiveCategories } from "@/lib/category-data";

export type GiftBasketItemDTO = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  priceKwd: number;
  quantity: number;
  available: boolean;
};

export type GiftBasketDTO = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  priceKwd: number;
  pricingMode: GiftBasketPricingMode;
  sortOrder: number;
  isFeatured: boolean;
  isSeasonal: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  includeGiftWrap: boolean;
  showOnGiftsPage: boolean;
  items: GiftBasketItemDTO[];
  available: boolean;
};

export type GiftBasketAdminDTO = GiftBasketDTO & {
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  visibility: GiftBasketVisibility;
  manualPriceKwd: number | null;
  occasionIds: string[];
};

export type BuilderProductDTO = {
  id: string;
  slug: string;
  name: string;
  image: string;
  priceKwd: number;
};

type BasketWithItems = GiftBasket & {
  items: (GiftBasketItem & { product: Product })[];
};

function localizeName(
  row: { nameEn: string; nameAr: string },
  locale: Locale
) {
  return locale === "ar" && row.nameAr.trim() ? row.nameAr : row.nameEn;
}

function localizeDescription(
  row: { descriptionEn: string; descriptionAr: string },
  locale: Locale
) {
  return locale === "ar" && row.descriptionAr.trim()
    ? row.descriptionAr
    : row.descriptionEn;
}

export function computeBasketPriceKwd(
  basket: Pick<
    GiftBasket,
    "pricingMode" | "manualPrice" | "includeGiftWrap"
  >,
  items: Array<{ quantity: number; product: Pick<Product, "price" | "isAvailable"> }>
): number {
  if (basket.pricingMode === GiftBasketPricingMode.MANUAL && basket.manualPrice != null) {
    return Number(basket.manualPrice);
  }

  let total = 0;
  for (const item of items) {
    if (!item.product.isAvailable) continue;
    total += Number(item.product.price) * item.quantity;
  }

  if (basket.includeGiftWrap) {
    const units = items.reduce((n, i) => n + i.quantity, 0);
    total += GIFT_WRAP_FEE_KWD * units;
  }

  return Math.round(total * 1000) / 1000;
}

export function basketIsAvailable(
  items: Array<{ quantity: number; product: Pick<Product, "isAvailable" | "stockQty"> }>
): boolean {
  if (items.length === 0) return false;
  return items.every((item) => {
    if (!item.product.isAvailable) return false;
    if (item.product.stockQty == null) return true;
    return item.product.stockQty >= item.quantity;
  });
}

function mapBasket(row: BasketWithItems, locale: Locale): GiftBasketDTO {
  const items: GiftBasketItemDTO[] = row.items
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({
      productId: item.productId,
      slug: item.product.slug,
      name:
        locale === "ar" && item.product.nameAr.trim()
          ? item.product.nameAr
          : item.product.name,
      image: item.product.image,
      priceKwd: Number(item.product.price),
      quantity: item.quantity,
      available: item.product.isAvailable,
    }));

  const available = basketIsAvailable(row.items);
  const priceKwd = computeBasketPriceKwd(row, row.items);

  return {
    id: row.id,
    slug: row.slug,
    name: localizeName(row, locale),
    description: localizeDescription(row, locale),
    image: row.image,
    priceKwd,
    pricingMode: row.pricingMode,
    sortOrder: row.sortOrder,
    isFeatured: row.isFeatured,
    isSeasonal: row.isSeasonal,
    isNew: row.isNew,
    isBestSeller: row.isBestSeller,
    includeGiftWrap: row.includeGiftWrap,
    showOnGiftsPage: row.showOnGiftsPage,
    items,
    available,
  };
}

const basketInclude = {
  items: {
    include: { product: true },
    orderBy: { sortOrder: "asc" as const },
  },
};

export async function getPublishedGiftBaskets(
  locale: Locale
): Promise<GiftBasketDTO[]> {
  const rows = await dbQuery([] as BasketWithItems[], () =>
    prisma.giftBasket.findMany({
      where: { visibility: GiftBasketVisibility.PUBLISHED },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: basketInclude,
    })
  );
  return rows.map((r) => mapBasket(r, locale)).filter((b) => b.available);
}

export async function getGiftBasketBySlug(
  slug: string,
  locale: Locale
): Promise<GiftBasketDTO | null> {
  const row = await dbQuery(null, () =>
    prisma.giftBasket.findFirst({
      where: { slug, visibility: GiftBasketVisibility.PUBLISHED },
      include: basketInclude,
    })
  );
  if (!row) return null;
  const mapped = mapBasket(row, locale);
  return mapped.available ? mapped : null;
}

export async function getAllGiftBasketsAdmin(): Promise<GiftBasketAdminDTO[]> {
  const rows = await dbQuery([], () =>
    prisma.giftBasket.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        ...basketInclude,
        occasions: { select: { occasionId: true } },
      },
    })
  );
  return rows.map((row) => {
    const base = mapBasket(row, "en");
    return {
      ...base,
      nameEn: row.nameEn,
      nameAr: row.nameAr,
      descriptionEn: row.descriptionEn,
      descriptionAr: row.descriptionAr,
      visibility: row.visibility,
      manualPriceKwd:
        row.manualPrice != null ? Number(row.manualPrice) : null,
      occasionIds: row.occasions.map((o) => o.occasionId),
    };
  });
}

export async function getBuilderCatalogProducts(
  locale: Locale
): Promise<BuilderProductDTO[]> {
  const rows = await dbQuery([], () =>
    prisma.product.findMany({
      where: { isAvailable: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    })
  );
  // Only offer products from active categories (hides seasonal ones, e.g. Ramadan).
  const activeKeys = new Set((await getActiveCategories()).map((c) => c.key));
  return rows.filter((p) => activeKeys.has(p.category)).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: locale === "ar" && p.nameAr.trim() ? p.nameAr : p.name,
    image: p.image,
    priceKwd: Number(p.price),
  }));
}

export async function loadGiftBasketsForCheckout(ids: string[]) {
  if (ids.length === 0) return [];
  return prisma.giftBasket.findMany({
    where: {
      id: { in: ids },
      visibility: GiftBasketVisibility.PUBLISHED,
    },
    include: basketInclude,
  });
}
