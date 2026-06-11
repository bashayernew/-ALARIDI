import type { Product } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { MenuSection, MenuProduct } from "@/lib/menu-data";
import { isPrismaConnectionError } from "@/lib/db-safe";
import { getActiveCategories } from "@/lib/category-data";
import { resolveStorefrontBranchIdOrDefault } from "@/lib/storefront-branch";
import { applyBranchToMenuPayload } from "@/lib/menu-branch";

export type MenuProductBilingual = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: number;
  oldPrice?: number;
  image: string;
  bestSeller?: boolean;
  promo?: boolean;
  customizable?: boolean;
  isNew?: boolean;
  category: Product["category"];
};

export type MenuSectionBilingual = {
  slug: string;
  labelEn: string;
  labelAr: string;
  products: MenuProductBilingual[];
};

export type MenuFullPagePayload = {
  sections: MenuSectionBilingual[];
};

function productToBilingual(p: Product): MenuProductBilingual {
  const price = Number(p.price);
  const oldPrice = p.oldPrice != null ? Number(p.oldPrice) : undefined;
  return {
    id: p.id,
    slug: p.slug,
    nameEn: p.name,
    nameAr: p.nameAr,
    descriptionEn: p.description,
    descriptionAr: p.descriptionAr,
    price,
    oldPrice,
    image: p.image,
    bestSeller: p.isBestSeller,
    promo: p.isPromo || (oldPrice != null && oldPrice > price),
    customizable: p.isCustomizable,
    isNew: p.isNew,
    category: p.category,
  };
}

export async function getMenuFullPagePayload(): Promise<MenuFullPagePayload> {
  try {
    const products = await prisma.product.findMany({
      where: { isAvailable: true },
      orderBy: [
        { category: "asc" },
        { isBestSeller: "desc" },
        { name: "asc" },
      ],
    });

    const byCategory = new Map<Product["category"], Product[]>();
    for (const p of products) {
      const arr = byCategory.get(p.category) ?? [];
      arr.push(p);
      byCategory.set(p.category, arr);
    }

    const categories = await getActiveCategories();
    const sections: MenuSectionBilingual[] = [];
    for (const cat of categories) {
      const rows = byCategory.get(cat.key);
      if (!rows?.length) continue;
      sections.push({
        slug: cat.sectionSlug,
        labelEn: cat.nameEn,
        labelAr: cat.nameAr.trim() ? cat.nameAr : cat.nameEn,
        products: rows.map(productToBilingual),
      });
    }

    const branchId = await resolveStorefrontBranchIdOrDefault();
    return applyBranchToMenuPayload({ sections }, branchId);
  } catch (e) {
    if (isPrismaConnectionError(e)) {
      return { sections: [] };
    }
    throw e;
  }
}

/** Menu for storefront pages — applies branch availability/pricing when a branch is set. */
export async function localizeMenuForStorefront(
  payload: MenuFullPagePayload,
  locale: "en" | "ar"
): Promise<MenuSection[]> {
  const branchId = await resolveStorefrontBranchIdOrDefault();
  const filtered = await applyBranchToMenuPayload(payload, branchId);
  return localizeMenuPayload(filtered, locale);
}

export function localizeMenuPayload(
  payload: MenuFullPagePayload,
  locale: "en" | "ar"
): MenuSection[] {
  return payload.sections.map((sec) => ({
    slug: sec.slug,
    label: locale === "ar" ? sec.labelAr : sec.labelEn,
    products: sec.products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: locale === "ar" && p.nameAr.trim() ? p.nameAr : p.nameEn,
      description:
        locale === "ar" && p.descriptionAr.trim()
          ? p.descriptionAr
          : p.descriptionEn,
      price: p.price,
      oldPrice: p.oldPrice,
      image: p.image,
      bestSeller: p.bestSeller,
      promo: p.promo,
      customizable: p.customizable,
      isNew: p.isNew,
      category: p.category,
    })),
  }));
}
