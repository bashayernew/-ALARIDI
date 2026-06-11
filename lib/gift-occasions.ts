import type { GiftOccasion } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dbQuery } from "@/lib/db-safe";
import type { Locale } from "@/lib/i18n";

export type GiftOccasionDTO = {
  id: string;
  slug: string;
  name: string;
  enabled: boolean;
  sortOrder: number;
  giftBasketIds: string[];
  giftCardProductIds: string[];
};

export type GiftOccasionAdminDTO = GiftOccasionDTO & {
  nameEn: string;
  nameAr: string;
};

type OccasionWithLinks = GiftOccasion & {
  giftBaskets: { giftBasketId: string }[];
  giftCards: { giftCardProductId: string }[];
};

function mapOccasion(row: OccasionWithLinks, locale: Locale): GiftOccasionDTO {
  return {
    id: row.id,
    slug: row.slug,
    name: locale === "ar" && row.nameAr.trim() ? row.nameAr : row.nameEn,
    enabled: row.enabled,
    sortOrder: row.sortOrder,
    giftBasketIds: row.giftBaskets.map((b) => b.giftBasketId),
    giftCardProductIds: row.giftCards.map((c) => c.giftCardProductId),
  };
}

const occasionInclude = {
  giftBaskets: { select: { giftBasketId: true } },
  giftCards: { select: { giftCardProductId: true } },
} as const;

export async function getEnabledGiftOccasions(
  locale: Locale
): Promise<GiftOccasionDTO[]> {
  const rows = await dbQuery([] as OccasionWithLinks[], () =>
    prisma.giftOccasion.findMany({
      where: { enabled: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: occasionInclude,
    })
  );
  return rows.map((r) => mapOccasion(r, locale));
}

export async function getAllGiftOccasionsAdmin(): Promise<GiftOccasionAdminDTO[]> {
  const rows = await dbQuery([] as OccasionWithLinks[], () =>
    prisma.giftOccasion.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: occasionInclude,
    })
  );
  return rows.map((row) => {
    const base = mapOccasion(row, "en");
    return {
      ...base,
      nameEn: row.nameEn,
      nameAr: row.nameAr,
    };
  });
}

export function filterOccasionsWithVisibleItems(
  occasions: GiftOccasionDTO[],
  visibleBasketIds: Set<string>,
  visibleCardIds: Set<string>
): GiftOccasionDTO[] {
  return occasions.filter(
    (o) =>
      o.giftBasketIds.some((id) => visibleBasketIds.has(id)) ||
      o.giftCardProductIds.some((id) => visibleCardIds.has(id))
  );
}
