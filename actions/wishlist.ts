"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomerId } from "@/lib/customer-auth/server";

export type WishlistResult =
  | { ok: true; inWishlist: boolean }
  | { ok: false; code: "unauthenticated" | "not_found" | "error" };

export async function toggleWishlist(productId: string): Promise<WishlistResult> {
  const customerId = await getCurrentCustomerId();
  if (!customerId) return { ok: false, code: "unauthenticated" };

  const existing = await prisma.wishlistItem.findUnique({
    where: { customerId_productId: { customerId, productId } },
  });
  if (existing) {
    await prisma.wishlistItem.delete({
      where: { customerId_productId: { customerId, productId } },
    });
    revalidatePath("/account");
    return { ok: true, inWishlist: false };
  }

  const exists = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!exists) return { ok: false, code: "not_found" };

  await prisma.wishlistItem.create({
    data: { customerId, productId },
  });
  revalidatePath("/account");
  return { ok: true, inWishlist: true };
}

export async function addToWishlist(productId: string): Promise<WishlistResult> {
  const customerId = await getCurrentCustomerId();
  if (!customerId) return { ok: false, code: "unauthenticated" };
  await prisma.wishlistItem.upsert({
    where: { customerId_productId: { customerId, productId } },
    update: {},
    create: { customerId, productId },
  });
  revalidatePath("/account");
  return { ok: true, inWishlist: true };
}

export async function removeFromWishlist(
  productId: string
): Promise<WishlistResult> {
  const customerId = await getCurrentCustomerId();
  if (!customerId) return { ok: false, code: "unauthenticated" };
  await prisma.wishlistItem
    .delete({ where: { customerId_productId: { customerId, productId } } })
    .catch(() => {});
  revalidatePath("/account");
  return { ok: true, inWishlist: false };
}

export async function isInWishlist(productId: string): Promise<boolean> {
  const customerId = await getCurrentCustomerId();
  if (!customerId) return false;
  const row = await prisma.wishlistItem.findUnique({
    where: { customerId_productId: { customerId, productId } },
    select: { id: true },
  });
  return !!row;
}
