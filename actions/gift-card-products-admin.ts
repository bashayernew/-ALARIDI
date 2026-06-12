"use server";

import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { disableGiftCardAdmin } from "@/lib/gift-card-activate";
import { isAdminSession } from "@/actions/admin-auth";
import { prisma } from "@/lib/prisma";
import { saveUploadedImage } from "@/lib/upload-image";

async function requireAdmin() {
  if (!(await isAdminSession())) throw new Error("Unauthorized");
}

export async function uploadGiftCardProductImage(
  formData: FormData
): Promise<string> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No file uploaded");
  }
  return saveUploadedImage(file, "gc-");
}

export type GiftCardProductForm = {
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  image: string;
  price: number;
  allowCustomAmount: boolean;
  presetAmounts: number[];
  minCustomAmount: number | null;
  maxCustomAmount: number | null;
  enabled: boolean;
  sortOrder: number;
};

function validateForm(data: GiftCardProductForm) {
  if (!data.titleEn.trim()) throw new Error("Title is required");
  if (!data.image.trim()) throw new Error("Image is required");
  if (!Number.isFinite(data.price) || data.price < 0.5 || data.price > 500) {
    throw new Error("Default price must be between 0.5 and 500 KWD");
  }
  if (data.allowCustomAmount) {
    const min = data.minCustomAmount ?? 1;
    const max = data.maxCustomAmount ?? 500;
    if (min < 0.5 || max > 500 || min > max) {
      throw new Error("Invalid custom amount range");
    }
  }
}

export async function createGiftCardProduct(data: GiftCardProductForm) {
  await requireAdmin();
  validateForm(data);
  await prisma.giftCardProduct.create({
    data: {
      titleEn: data.titleEn.trim(),
      titleAr: data.titleAr.trim(),
      descriptionEn: data.descriptionEn.trim(),
      descriptionAr: data.descriptionAr.trim(),
      image: data.image.trim(),
      price: data.price,
      allowCustomAmount: data.allowCustomAmount,
      presetAmounts: data.presetAmounts,
      minCustomAmount: data.minCustomAmount,
      maxCustomAmount: data.maxCustomAmount,
      enabled: data.enabled,
      sortOrder: data.sortOrder,
    },
  });
  revalidatePath("/admin/gift-cards");
  revalidatePath("/gifts");
  revalidatePath("/gifts/buy");
}

export async function updateGiftCardProduct(
  id: string,
  data: GiftCardProductForm
) {
  await requireAdmin();
  validateForm(data);
  await prisma.giftCardProduct.update({
    where: { id },
    data: {
      titleEn: data.titleEn.trim(),
      titleAr: data.titleAr.trim(),
      descriptionEn: data.descriptionEn.trim(),
      descriptionAr: data.descriptionAr.trim(),
      image: data.image.trim(),
      price: data.price,
      allowCustomAmount: data.allowCustomAmount,
      presetAmounts: data.presetAmounts,
      minCustomAmount: data.minCustomAmount,
      maxCustomAmount: data.maxCustomAmount,
      enabled: data.enabled,
      sortOrder: data.sortOrder,
    },
  });
  revalidatePath("/admin/gift-cards");
  revalidatePath("/gifts");
  revalidatePath("/gifts/buy");
}

export async function deleteGiftCardProduct(id: string) {
  await requireAdmin();
  const linked = await prisma.orderGiftCardItem.count({
    where: { giftCardProductId: id },
  });
  if (linked > 0) {
    await prisma.giftCardProduct.update({
      where: { id },
      data: { enabled: false },
    });
  } else {
    await prisma.giftCardProduct.delete({ where: { id } });
  }
  revalidatePath("/admin/gift-cards");
  revalidatePath("/gifts");
  revalidatePath("/gifts/buy");
}

export async function setGiftCardEnabled(id: string, enabled: boolean) {
  await requireAdmin();
  if (enabled) {
    await prisma.giftCard.update({
      where: { id },
      data: { enabled: true, status: "ACTIVE" },
    });
  } else {
    await prisma.$transaction((tx) => disableGiftCardAdmin(tx, id));
  }
  revalidatePath("/admin/gift-cards");
  revalidatePath("/account");
}

export async function deleteIssuedGiftCard(id: string) {
  await requireAdmin();
  const card = await prisma.giftCard.findUnique({
    where: { id },
    include: { txns: { where: { type: "REDEEM" }, take: 1 } },
  });
  if (!card) throw new Error("Gift card not found");
  if (card.txns.length > 0) {
    await prisma.giftCard.update({
      where: { id },
      data: { enabled: false, balance: 0 },
    });
  } else {
    await prisma.giftCardTxn.deleteMany({ where: { giftCardId: id } });
    await prisma.giftCard.delete({ where: { id } });
  }
  revalidatePath("/admin/gift-cards");
  revalidatePath("/account");
}
