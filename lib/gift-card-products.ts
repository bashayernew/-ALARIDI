import { prisma } from "@/lib/prisma";
import { dbQuery } from "@/lib/db-safe";
import type { Locale } from "@/lib/i18n";

export type GiftCardProductDTO = {
  id: string;
  title: string;
  description: string;
  image: string;
  priceKwd: number;
  presetAmounts: number[];
  allowCustomAmount: boolean;
  minCustomAmount: number | null;
  maxCustomAmount: number | null;
  sortOrder: number;
};

export type GiftCardProductAdminDTO = GiftCardProductDTO & {
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  enabled: boolean;
};

function mapProduct(
  row: {
    id: string;
    titleEn: string;
    titleAr: string;
    descriptionEn: string;
    descriptionAr: string;
    image: string;
    price: { toString(): string } | number;
    presetAmounts?: ({ toString(): string } | number)[];
    allowCustomAmount?: boolean;
    minCustomAmount?: { toString(): string } | number | null;
    maxCustomAmount?: { toString(): string } | number | null;
    sortOrder: number;
    enabled?: boolean;
  },
  locale: Locale
): GiftCardProductDTO {
  const priceKwd = Number(row.price);
  const presets = (row.presetAmounts ?? []).map(Number).filter((n) => n > 0);
  return {
    id: row.id,
    title: locale === "ar" && row.titleAr.trim() ? row.titleAr : row.titleEn,
    description:
      locale === "ar" && row.descriptionAr.trim()
        ? row.descriptionAr
        : row.descriptionEn,
    image: row.image,
    priceKwd,
    presetAmounts:
      presets.length > 0 ? presets : [priceKwd],
    allowCustomAmount: row.allowCustomAmount ?? false,
    minCustomAmount:
      row.minCustomAmount != null ? Number(row.minCustomAmount) : null,
    maxCustomAmount:
      row.maxCustomAmount != null ? Number(row.maxCustomAmount) : null,
    sortOrder: row.sortOrder,
  };
}

export async function getEnabledGiftCardProducts(
  locale: Locale
): Promise<GiftCardProductDTO[]> {
  const rows = await dbQuery([], () =>
    prisma.giftCardProduct.findMany({
      where: { enabled: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    })
  );
  return rows.map((r) => mapProduct(r, locale));
}

export async function getAllGiftCardProductsAdmin(): Promise<
  GiftCardProductAdminDTO[]
> {
  const rows = await dbQuery([], () =>
    prisma.giftCardProduct.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    })
  );
  return rows.map((r) => ({
    ...mapProduct(r, "en"),
    titleEn: r.titleEn,
    titleAr: r.titleAr,
    descriptionEn: r.descriptionEn,
    descriptionAr: r.descriptionAr,
    enabled: r.enabled,
  }));
}
