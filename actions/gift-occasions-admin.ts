"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/actions/admin-auth";

async function requireAdmin() {
  if (!(await isAdminSession())) throw new Error("Unauthorized");
}

export type GiftOccasionForm = {
  nameEn: string;
  nameAr: string;
  enabled: boolean;
  sortOrder: number;
  giftBasketIds: string[];
  giftCardProductIds: string[];
};

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
  let candidate = base || "occasion";
  let n = 1;
  while (true) {
    const existing = await prisma.giftOccasion.findUnique({
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

function validateForm(data: GiftOccasionForm) {
  if (!data.nameEn.trim()) throw new Error("Name is required");
  if (
    data.giftBasketIds.length === 0 &&
    data.giftCardProductIds.length === 0
  ) {
    throw new Error("Assign at least one gift basket or gift card");
  }
}

function revalidateAll() {
  revalidatePath("/admin/occasions");
  revalidatePath("/gifts");
}

async function syncAssignments(
  occasionId: string,
  giftBasketIds: string[],
  giftCardProductIds: string[]
) {
  await prisma.$transaction(async (tx) => {
    await tx.giftOccasionBasket.deleteMany({ where: { occasionId } });
    await tx.giftOccasionGiftCard.deleteMany({ where: { occasionId } });
    if (giftBasketIds.length > 0) {
      await tx.giftOccasionBasket.createMany({
        data: giftBasketIds.map((giftBasketId) => ({
          occasionId,
          giftBasketId,
        })),
      });
    }
    if (giftCardProductIds.length > 0) {
      await tx.giftOccasionGiftCard.createMany({
        data: giftCardProductIds.map((giftCardProductId) => ({
          occasionId,
          giftCardProductId,
        })),
      });
    }
  });
}

export async function createGiftOccasion(data: GiftOccasionForm) {
  await requireAdmin();
  validateForm(data);
  const slug = await uniqueSlug(slugify(data.nameEn));
  const row = await prisma.giftOccasion.create({
    data: {
      slug,
      nameEn: data.nameEn.trim(),
      nameAr: data.nameAr.trim(),
      enabled: data.enabled,
      sortOrder: data.sortOrder,
    },
  });
  await syncAssignments(row.id, data.giftBasketIds, data.giftCardProductIds);
  revalidateAll();
}

export async function updateGiftOccasion(id: string, data: GiftOccasionForm) {
  await requireAdmin();
  validateForm(data);
  await prisma.giftOccasion.update({
    where: { id },
    data: {
      nameEn: data.nameEn.trim(),
      nameAr: data.nameAr.trim(),
      enabled: data.enabled,
      sortOrder: data.sortOrder,
    },
  });
  await syncAssignments(id, data.giftBasketIds, data.giftCardProductIds);
  revalidateAll();
}

export async function deleteGiftOccasion(id: string) {
  await requireAdmin();
  await prisma.giftOccasion.delete({ where: { id } });
  revalidateAll();
}

export async function setGiftOccasionEnabled(id: string, enabled: boolean) {
  await requireAdmin();
  await prisma.giftOccasion.update({ where: { id }, data: { enabled } });
  revalidateAll();
}
