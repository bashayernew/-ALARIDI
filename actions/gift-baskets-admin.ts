"use server";

import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import {
  GiftBasketPricingMode,
  GiftBasketVisibility,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/actions/admin-auth";
import { saveUploadedImage } from "@/lib/upload-image";

async function requireAdmin() {
  if (!(await isAdminSession())) throw new Error("Unauthorized");
}

export async function uploadGiftBasketImage(formData: FormData): Promise<string> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No file uploaded");
  }
  return saveUploadedImage(file, "gb-");
}

export type GiftBasketItemInput = {
  productId: string;
  quantity: number;
  sortOrder: number;
};

export type GiftBasketForm = {
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  image: string;
  pricingMode: GiftBasketPricingMode;
  manualPrice: number | null;
  visibility: GiftBasketVisibility;
  sortOrder: number;
  isFeatured: boolean;
  isSeasonal: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  includeGiftWrap: boolean;
  showOnGiftsPage: boolean;
  items: GiftBasketItemInput[];
  occasionIds: string[];
};

const MAX_GIFTS_PAGE_BASKETS = 2;

// Enforce that at most MAX_GIFTS_PAGE_BASKETS baskets are featured on the Gifts page.
async function assertGiftsPageLimit(enabled: boolean, excludeId?: string) {
  if (!enabled) return;
  const count = await prisma.giftBasket.count({
    where: {
      showOnGiftsPage: true,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  if (count >= MAX_GIFTS_PAGE_BASKETS) {
    throw new Error(
      `Only ${MAX_GIFTS_PAGE_BASKETS} baskets can be shown on the gifts page. Turn one off first.`
    );
  }
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

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let candidate = base || "gift-basket";
  let n = 1;
  while (true) {
    const existing = await prisma.giftBasket.findUnique({
      where: { slug: candidate },
    });
    if (!existing || existing.id === excludeId) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
    if (n > 25) {
      return `${base}-${Math.random().toString(36).slice(2, 8)}`;
    }
  }
}

function validateForm(data: GiftBasketForm) {
  if (!data.nameEn.trim()) throw new Error("Name is required");
  if (!data.image.trim()) throw new Error("Image is required");
  if (data.items.length === 0) throw new Error("Add at least one product");
  if (
    data.pricingMode === GiftBasketPricingMode.MANUAL &&
    (data.manualPrice == null || data.manualPrice < 0.5)
  ) {
    throw new Error("Manual price must be at least 0.5 KWD");
  }
  for (const item of data.items) {
    if (!item.productId) throw new Error("Invalid product in basket");
    if (!Number.isFinite(item.quantity) || item.quantity < 1) {
      throw new Error("Product quantities must be at least 1");
    }
  }
}

function revalidateAll() {
  revalidatePath("/admin/gift-baskets");
  revalidatePath("/gifts");
  revalidatePath("/gifts/buy");
  revalidatePath("/occasions");
  revalidatePath("/admin/occasions");
}

export async function createGiftBasket(data: GiftBasketForm) {
  await requireAdmin();
  validateForm(data);
  await assertGiftsPageLimit(data.showOnGiftsPage);
  const slug = await uniqueSlug(slugify(data.nameEn));
  await prisma.giftBasket.create({
    data: {
      slug,
      nameEn: data.nameEn.trim(),
      nameAr: data.nameAr.trim(),
      descriptionEn: data.descriptionEn.trim(),
      descriptionAr: data.descriptionAr.trim(),
      image: data.image.trim(),
      pricingMode: data.pricingMode,
      manualPrice:
        data.pricingMode === GiftBasketPricingMode.MANUAL
          ? data.manualPrice
          : null,
      visibility: data.visibility,
      sortOrder: data.sortOrder,
      isFeatured: data.isFeatured,
      isSeasonal: data.isSeasonal,
      isNew: data.isNew,
      isBestSeller: data.isBestSeller,
      includeGiftWrap: data.includeGiftWrap,
      showOnGiftsPage: data.showOnGiftsPage,
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          sortOrder: item.sortOrder,
        })),
      },
      occasions: {
        create: data.occasionIds.map((occasionId) => ({ occasionId })),
      },
    },
  });
  revalidateAll();
}

export async function updateGiftBasket(id: string, data: GiftBasketForm) {
  await requireAdmin();
  validateForm(data);
  await assertGiftsPageLimit(data.showOnGiftsPage, id);
  await prisma.$transaction(async (tx) => {
    await tx.giftBasketItem.deleteMany({ where: { giftBasketId: id } });
    await tx.giftOccasionBasket.deleteMany({ where: { giftBasketId: id } });
    await tx.giftBasket.update({
      where: { id },
      data: {
        nameEn: data.nameEn.trim(),
        nameAr: data.nameAr.trim(),
        descriptionEn: data.descriptionEn.trim(),
        descriptionAr: data.descriptionAr.trim(),
        image: data.image.trim(),
        pricingMode: data.pricingMode,
        manualPrice:
          data.pricingMode === GiftBasketPricingMode.MANUAL
            ? data.manualPrice
            : null,
        visibility: data.visibility,
        sortOrder: data.sortOrder,
        isFeatured: data.isFeatured,
        isSeasonal: data.isSeasonal,
        isNew: data.isNew,
        isBestSeller: data.isBestSeller,
        includeGiftWrap: data.includeGiftWrap,
        showOnGiftsPage: data.showOnGiftsPage,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            sortOrder: item.sortOrder,
          })),
        },
        occasions: {
          create: data.occasionIds.map((occasionId) => ({ occasionId })),
        },
      },
    });
  });
  revalidateAll();
}

export async function deleteGiftBasket(id: string) {
  await requireAdmin();
  const linked = await prisma.orderGiftBasketItem.count({
    where: { giftBasketId: id },
  });
  if (linked > 0) {
    await prisma.giftBasket.update({
      where: { id },
      data: { visibility: GiftBasketVisibility.HIDDEN },
    });
  } else {
    await prisma.giftBasket.delete({ where: { id } });
  }
  revalidateAll();
}

export async function setGiftBasketVisibility(
  id: string,
  visibility: GiftBasketVisibility
) {
  await requireAdmin();
  await prisma.giftBasket.update({ where: { id }, data: { visibility } });
  revalidateAll();
}
