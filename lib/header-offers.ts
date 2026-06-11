import { prisma } from "@/lib/prisma";
import { dbQueryWithFlag } from "@/lib/db-safe";
import { branchScopedOrGlobal } from "@/lib/branch-scope";
import type { HeaderOffer, HeaderOfferPlacement } from "@prisma/client";
import type { Locale } from "@/lib/i18n";

export type HeaderOfferDTO = {
  id: string;
  title: string;
  shortText: string;
  icon: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  placement: HeaderOfferPlacement;
  sortOrder: number;
};

function isOfferActive(row: HeaderOffer, now = new Date()): boolean {
  if (!row.enabled) return false;
  if (row.startsAt && row.startsAt > now) return false;
  if (row.expiresAt && row.expiresAt < now) return false;
  return true;
}

export function toHeaderOfferDTO(
  row: HeaderOffer,
  locale: Locale
): HeaderOfferDTO {
  const ar = locale === "ar";
  return {
    id: row.id,
    title: ar ? row.titleAr || row.titleEn : row.titleEn || row.titleAr,
    shortText: ar
      ? row.shortTextAr || row.shortTextEn
      : row.shortTextEn || row.shortTextAr,
    icon: row.icon,
    image: row.image ?? "",
    ctaText: ar ? row.ctaTextAr || row.ctaTextEn : row.ctaTextEn || row.ctaTextAr,
    ctaLink: row.ctaLink,
    placement: row.placement,
    sortOrder: row.sortOrder,
  };
}

export async function fetchActiveHeaderOffers(
  storefrontBranchId?: string | null
): Promise<HeaderOffer[]> {
  const now = new Date();
  const branchFilter = storefrontBranchId
    ? branchScopedOrGlobal(storefrontBranchId)
    : {};
  const { data } = await dbQueryWithFlag(
    [] as HeaderOffer[],
    () =>
      prisma.headerOffer.findMany({
        where: {
          enabled: true,
          ...branchFilter,
          AND: [
            { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
            { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
          ],
        },
        orderBy: [{ placement: "asc" }, { sortOrder: "asc" }],
      })
  );
  return data.filter((row) => isOfferActive(row, now));
}

export function groupHeaderOffersByPlacement(
  rows: HeaderOffer[],
  locale: Locale
): Record<HeaderOfferPlacement, HeaderOfferDTO[]> {
  const grouped: Record<HeaderOfferPlacement, HeaderOfferDTO[]> = {
    TOP_ANNOUNCEMENT: [],
    HERO_BADGE: [],
    FEATURE_STRIP: [],
  };
  for (const row of rows) {
    grouped[row.placement].push(toHeaderOfferDTO(row, locale));
  }
  return grouped;
}
