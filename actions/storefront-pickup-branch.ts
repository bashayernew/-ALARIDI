"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { STOREFRONT_PICKUP_BRANCH_COOKIE } from "@/lib/pickup-branch";
import { cookies } from "next/headers";

export async function setStorefrontPickupBranch(
  branchId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const id = branchId.trim();
  if (!id) return { ok: false, error: "Invalid branch" };

  try {
    const row = await prisma.branch.findFirst({
      where: { id, active: true },
      select: { id: true },
    });
    if (!row) return { ok: false, error: "Branch not found" };
  } catch {
    return { ok: false, error: "Could not verify branch" };
  }

  const jar = await cookies();
  jar.set(STOREFRONT_PICKUP_BRANCH_COOKIE, id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function clearStorefrontPickupBranch(): Promise<{ ok: true }> {
  const jar = await cookies();
  jar.delete(STOREFRONT_PICKUP_BRANCH_COOKIE);
  revalidatePath("/", "layout");
  return { ok: true };
}
