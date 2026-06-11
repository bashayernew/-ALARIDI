"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-session";
import { resolveWriteBranchIds, listBranches } from "@/lib/admin-branch";

export type DeliveryAreaRowInput = {
  governorate: string;
  area: string;
  enabled: boolean;
  deliveryFeeKwd: number;
};

export async function saveBranchDeliveryAreas(input: {
  branchId: string;
  rows: DeliveryAreaRowInput[];
}): Promise<void> {
  const session = await getAdminSession();
  if (!session) throw new Error("Unauthorized");
  // Only the super admin assigns which branch delivers to which areas.
  if (session.role !== "SUPER_ADMIN") {
    throw new Error("Forbidden: only the super admin can set delivery areas.");
  }

  const targetBranchIds = await resolveWriteBranchIds(session, input.branchId);

  await prisma.$transaction(
    targetBranchIds.flatMap((branchId) =>
      input.rows.map((row) =>
        prisma.branchDeliveryArea.upsert({
          where: {
            branchId_area: {
              branchId,
              area: row.area,
            },
          },
          update: {
            governorate: row.governorate,
            enabled: row.enabled,
            deliveryFeeKwd: Math.max(0, row.deliveryFeeKwd),
          },
          create: {
            branchId,
            governorate: row.governorate,
            area: row.area,
            enabled: row.enabled,
            deliveryFeeKwd: Math.max(0, row.deliveryFeeKwd),
          },
        })
      )
    )
  );

  revalidatePath("/admin/delivery-areas");
  revalidatePath("/", "layout");
}

export type DeliveryAreaAssignmentInput = {
  governorate: string;
  area: string;
  /** The single branch that delivers to this area, or null for "no delivery". */
  branchId: string | null;
  deliveryFeeKwd: number;
};

/**
 * Super-admin assignment of exactly ONE branch per delivery area.
 *
 * Each area can be served by at most one branch. Assigning a branch to an area
 * automatically removes that area from every other branch, so a customer in
 * that area always resolves to a single branch (its menu, product availability,
 * and the branch admin who handles the order). An area with `branchId: null`
 * is not delivered to (pickup only).
 */
export async function saveDeliveryAreaAssignments(input: {
  rows: DeliveryAreaAssignmentInput[];
}): Promise<void> {
  const session = await getAdminSession();
  if (!session) throw new Error("Unauthorized");
  if (session.role !== "SUPER_ADMIN") {
    throw new Error("Forbidden: only the super admin can set delivery areas.");
  }

  const validBranchIds = new Set((await listBranches()).map((b) => b.id));

  await prisma.$transaction(async (tx) => {
    if (input.rows.length === 0) return;

    // Clear every area in the payload across all branches, then recreate the
    // single chosen branch per area. This guarantees one-branch-per-area.
    await tx.branchDeliveryArea.deleteMany({
      where: {
        OR: input.rows.map((r) => ({
          governorate: r.governorate,
          area: r.area,
        })),
      },
    });

    const toCreate = input.rows
      .filter((r) => r.branchId && validBranchIds.has(r.branchId))
      .map((r) => ({
        branchId: r.branchId as string,
        governorate: r.governorate,
        area: r.area,
        enabled: true,
        deliveryFeeKwd: Math.max(0, r.deliveryFeeKwd),
      }));

    if (toCreate.length > 0) {
      await tx.branchDeliveryArea.createMany({ data: toCreate });
    }
  });

  revalidatePath("/admin/delivery-areas");
  revalidatePath("/", "layout");
}
