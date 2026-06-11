"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-session";
import { resolveWriteBranchIds } from "@/lib/admin-branch";

/**
 * Set whether a product is present at a branch (and an optional
 * branch-specific price). When no row exists the product is considered
 * available at the branch by default.
 *
 * When `branchId` is the "All branches" sentinel, the change is written to
 * every branch at once (super-admins only).
 */
export async function setBranchAvailability(input: {
  branchId: string;
  productId: string;
  available: boolean;
  priceOverride?: number | null;
}): Promise<void> {
  const session = await getAdminSession();
  if (!session) throw new Error("Unauthorized");

  const targetBranchIds = await resolveWriteBranchIds(session, input.branchId);

  const price =
    input.priceOverride == null || Number.isNaN(input.priceOverride)
      ? null
      : input.priceOverride;

  await prisma.$transaction(
    targetBranchIds.map((branchId) =>
      prisma.branchProductAvailability.upsert({
        where: {
          branchId_productId: {
            branchId,
            productId: input.productId,
          },
        },
        update: { available: input.available, priceOverride: price },
        create: {
          branchId,
          productId: input.productId,
          available: input.available,
          priceOverride: price,
        },
      })
    )
  );
  revalidatePath("/menu");
  revalidatePath("/search");
}
