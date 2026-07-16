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

export type OwnDeliveryAreaUpdate = {
  area: string;
  enabled: boolean;
  deliveryFeeKwd: number;
};

/**
 * Branch admins can adjust the delivery fee and enable/disable delivery for
 * the areas the super admin assigned to their branch. They cannot add or
 * remove areas — only the super admin assigns areas to branches.
 */
export async function updateOwnBranchDeliveryAreas(input: {
  rows: OwnDeliveryAreaUpdate[];
}): Promise<void> {
  const session = await getAdminSession();
  if (!session) throw new Error("Unauthorized");
  const branchId =
    session.role === "BRANCH_ADMIN" ? session.branchId : null;
  if (!branchId) {
    throw new Error("Forbidden: only branch admins can use this action.");
  }

  const assigned = await prisma.branchDeliveryArea.findMany({
    where: { branchId },
    select: { area: true },
  });
  const allowed = new Set(assigned.map((a) => a.area));
  const updates = input.rows.filter((r) => allowed.has(r.area));

  await prisma.$transaction(
    updates.map((r) =>
      prisma.branchDeliveryArea.update({
        where: { branchId_area: { branchId, area: r.area } },
        data: {
          enabled: r.enabled,
          deliveryFeeKwd: Math.max(0, r.deliveryFeeKwd),
        },
      })
    )
  );

  revalidatePath("/admin/delivery-areas");
  revalidatePath("/", "layout");
}

/**
 * Super-admin: set the full list of areas a branch manages/delivers to.
 * Selected areas are taken over from any other branch (one branch per area);
 * areas no longer selected are removed from the branch. Existing fees are kept.
 */
export async function assignAreasToBranch(input: {
  branchId: string;
  areas: { governorate: string; area: string }[];
}): Promise<void> {
  const session = await getAdminSession();
  if (!session) throw new Error("Unauthorized");
  if (session.role !== "SUPER_ADMIN") {
    throw new Error("Forbidden: only the super admin can assign areas.");
  }

  const existing = await prisma.branchDeliveryArea.findMany({
    where: { branchId: input.branchId },
  });
  const feeByArea = new Map(
    existing.map((r) => [r.area, Number(r.deliveryFeeKwd)])
  );
  const selectedAreas = new Set(input.areas.map((a) => a.area));

  await prisma.$transaction(async (tx) => {
    if (input.areas.length > 0) {
      // Take the selected areas away from every branch (incl. this one).
      await tx.branchDeliveryArea.deleteMany({
        where: {
          OR: input.areas.map((a) => ({
            governorate: a.governorate,
            area: a.area,
          })),
        },
      });
    }
    // Drop areas that were unticked for this branch.
    await tx.branchDeliveryArea.deleteMany({
      where: {
        branchId: input.branchId,
        area: { notIn: [...selectedAreas] },
      },
    });
    if (input.areas.length > 0) {
      await tx.branchDeliveryArea.createMany({
        data: input.areas.map((a) => ({
          branchId: input.branchId,
          governorate: a.governorate,
          area: a.area,
          enabled: true,
          deliveryFeeKwd: feeByArea.get(a.area) ?? 0,
        })),
      });
    }
  });

  revalidatePath("/admin/delivery-areas");
  revalidatePath("/admin/accounts");
  revalidatePath("/", "layout");
}
