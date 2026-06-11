import "server-only";

import {
  getActiveBranchId,
  listBranches,
  ALL_BRANCHES,
} from "@/lib/admin-branch";
import type { AdminSession } from "@/lib/admin-session";
import type { BranchDTO } from "@/lib/branches";
import { branchScopedOrGlobal } from "@/lib/branch-scope";
import {
  resolveDeliveryStorefrontBranch,
  resolveStorefrontBranchId,
} from "@/lib/storefront-branch";

export { branchScopedOrGlobal };

/** Branch for checkout: explicit pickup branch id, or delivery area resolution. */
export async function resolveCheckoutBranchId(input: {
  fulfillmentType: "DELIVERY" | "PICKUP" | "SCHEDULED";
  pickupBranchId?: string | null;
}): Promise<string | null> {
  if (input.fulfillmentType === "PICKUP") {
    const id = input.pickupBranchId?.trim();
    return id || null;
  }
  const resolved = await resolveDeliveryStorefrontBranch();
  return resolved?.branchId ?? null;
}

export { resolveStorefrontBranchId };

export async function assertAdminCanAccessOrder(
  orderBranchId: string | null,
  session: AdminSession,
  branches: BranchDTO[]
): Promise<void> {
  const activeBranchId = await getActiveBranchId(session, branches);
  if (!activeBranchId) return;
  // Super-admin in "All branches" mode may act on any order.
  if (activeBranchId === ALL_BRANCHES) return;
  if (orderBranchId !== activeBranchId) {
    throw new Error("Forbidden: order belongs to another branch.");
  }
}
