"use server";

import { revalidatePath } from "next/cache";
import { PromoDiscountType, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/actions/admin-auth";

async function requireAdmin() {
  if (!(await isAdminSession())) throw new Error("Unauthorized");
}

export type PromoCodeFormInput = {
  code: string;
  description?: string;
  discountType: PromoDiscountType;
  discountValue: number;
  startsAt: Date | null;
  endsAt: Date | null;
  minOrderAmount: number | null;
  maxUses: number | null;
  maxUsesPerCustomer: number | null;
  isPublic: boolean;
  enabled: boolean;
  productIds: string[];
  categories: string[];
};

function normalizeForm(input: PromoCodeFormInput) {
  if (!input.code.trim()) throw new Error("Code is required");
  if (!Number.isFinite(input.discountValue) || input.discountValue < 0) {
    throw new Error("Invalid discount value");
  }
  if (input.discountType === "PERCENT" && input.discountValue > 100) {
    throw new Error("Percent discount cannot exceed 100");
  }
  return {
    code: input.code.trim().toUpperCase(),
    description: input.description?.trim() ?? "",
    discountType: input.discountType,
    discountValue: input.discountValue,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    minOrderAmount: input.minOrderAmount,
    maxUses: input.maxUses,
    maxUsesPerCustomer: input.maxUsesPerCustomer,
    isPublic: input.isPublic,
    enabled: input.enabled,
    productIds: [...new Set(input.productIds)],
    categories: [...new Set(input.categories)],
  };
}

async function syncPromoScope(
  promoCodeId: string,
  productIds: string[],
  categories: string[]
) {
  await prisma.promoCodeProduct.deleteMany({ where: { promoCodeId } });
  await prisma.promoCodeCategory.deleteMany({ where: { promoCodeId } });
  if (productIds.length > 0) {
    await prisma.promoCodeProduct.createMany({
      data: productIds.map((productId) => ({ promoCodeId, productId })),
    });
  }
  if (categories.length > 0) {
    await prisma.promoCodeCategory.createMany({
      data: categories.map((category) => ({ promoCodeId, category })),
    });
  }
}

export async function createPromoCode(input: PromoCodeFormInput) {
  await requireAdmin();
  const data = normalizeForm(input);
  const created = await prisma.promoCode.create({
    data: {
      code: data.code,
      description: data.description,
      discountType: data.discountType,
      discountValue: data.discountValue,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      minOrderAmount: data.minOrderAmount,
      maxUses: data.maxUses,
      maxUsesPerCustomer: data.maxUsesPerCustomer,
      isPublic: data.isPublic,
      enabled: data.enabled,
    },
  });
  await syncPromoScope(created.id, data.productIds, data.categories);
  revalidatePath("/admin/promos");
  revalidatePath("/promotions");
  revalidatePath("/checkout");
}

export async function updatePromoCode(
  id: string,
  input: Partial<PromoCodeFormInput>
) {
  await requireAdmin();
  const patch: Prisma.PromoCodeUpdateInput = {};
  if (input.code !== undefined) patch.code = input.code.trim().toUpperCase();
  if (input.description !== undefined) patch.description = input.description.trim();
  if (input.discountType !== undefined) patch.discountType = input.discountType;
  if (input.discountValue !== undefined) patch.discountValue = input.discountValue;
  if (input.startsAt !== undefined) patch.startsAt = input.startsAt;
  if (input.endsAt !== undefined) patch.endsAt = input.endsAt;
  if (input.minOrderAmount !== undefined) patch.minOrderAmount = input.minOrderAmount;
  if (input.maxUses !== undefined) patch.maxUses = input.maxUses;
  if (input.maxUsesPerCustomer !== undefined) {
    patch.maxUsesPerCustomer = input.maxUsesPerCustomer;
  }
  if (input.isPublic !== undefined) patch.isPublic = input.isPublic;
  if (input.enabled !== undefined) patch.enabled = input.enabled;

  if (Object.keys(patch).length > 0) {
    await prisma.promoCode.update({ where: { id }, data: patch });
  }

  if (input.productIds !== undefined || input.categories !== undefined) {
    const current = await prisma.promoCode.findUnique({
      where: { id },
      include: { products: true, categories: true },
    });
    if (!current) throw new Error("Promo not found");
    await syncPromoScope(
      id,
      input.productIds ?? current.products.map((p) => p.productId),
      input.categories ?? current.categories.map((c) => c.category)
    );
  }

  revalidatePath("/admin/promos");
  revalidatePath("/promotions");
  revalidatePath("/checkout");
}

export async function deletePromoCode(id: string) {
  await requireAdmin();
  await prisma.promoCode.delete({ where: { id } });
  revalidatePath("/admin/promos");
  revalidatePath("/promotions");
  revalidatePath("/checkout");
}

export async function setPromoCodeEnabled(id: string, enabled: boolean) {
  await requireAdmin();
  await prisma.promoCode.update({ where: { id }, data: { enabled } });
  revalidatePath("/admin/promos");
  revalidatePath("/promotions");
  revalidatePath("/checkout");
}
