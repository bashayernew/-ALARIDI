import "server-only";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { listBranches } from "@/lib/branch-list";
import {
  parseAreaCookie,
  STOREFRONT_AREA_COOKIE,
  type SelectedKuwaitArea,
} from "@/lib/kuwait-areas";
import {
  FALLBACK_PICKUP_BRANCHES,
  STOREFRONT_PICKUP_BRANCH_COOKIE,
  type PickupBranchOption,
} from "@/lib/pickup-branch";

export type StorefrontBranchResolution = {
  branchId: string;
  deliveryFeeKwd: number;
};

/** Active branches for pickup selection, ordered by sortOrder. */
export async function getPickupBranches(): Promise<PickupBranchOption[]> {
  const rows = await listBranches();
  if (rows.length === 0) return FALLBACK_PICKUP_BRANCHES;
  return rows.map((b) => ({
    id: b.id,
    nameEn: b.name,
    nameAr: b.nameAr,
    area: b.area,
  }));
}

/** Customer-selected pickup branch from cookie (Branch.id). */
export async function getSelectedPickupBranchId(): Promise<string | null> {
  const jar = await cookies();
  const id = jar.get(STOREFRONT_PICKUP_BRANCH_COOKIE)?.value?.trim();
  if (!id) return null;
  try {
    const row = await prisma.branch.findFirst({
      where: { id, active: true },
      select: { id: true },
    });
    if (row) return row.id;
  } catch {
    /* DB offline — allow fallback ids for gift flows only */
    if (FALLBACK_PICKUP_BRANCHES.some((b) => b.id === id)) return id;
  }
  return null;
}

/**
 * Branch id for menu/CMS scoping: pickup cookie first, then delivery area resolution.
 */
export async function resolveStorefrontBranchId(): Promise<string | null> {
  const pickupId = await getSelectedPickupBranchId();
  if (pickupId) return pickupId;

  const resolved = await resolveDeliveryStorefrontBranch();
  return resolved?.branchId ?? null;
}

/**
 * The fallback branch to use when the customer's pickup/area doesn't resolve to
 * a specific branch — the first active branch by sortOrder. This guarantees the
 * storefront always reflects *some* branch's availability and pricing, so
 * products hidden at that branch never leak into the menu.
 */
export async function getDefaultStorefrontBranchId(): Promise<string | null> {
  const branches = await listBranches();
  return branches[0]?.id ?? null;
}

/**
 * Branch id for the menu, always non-null when at least one branch exists:
 * pickup → area → default branch. Used so per-branch "Show in store" settings
 * are always applied on the storefront.
 */
export async function resolveStorefrontBranchIdOrDefault(): Promise<
  string | null
> {
  const resolved = await resolveStorefrontBranchId();
  if (resolved) return resolved;
  return getDefaultStorefrontBranchId();
}

/** Delivery area → branch + fee (ignores pickup cookie). */
export async function resolveDeliveryStorefrontBranch(): Promise<StorefrontBranchResolution | null> {
  const selected = await getSelectedArea();
  if (!selected) return null;

  try {
    const row = await prisma.branchDeliveryArea.findFirst({
      where: {
        governorate: selected.governorateKey,
        area: selected.areaKey,
        enabled: true,
        branch: { active: true },
      },
      orderBy: { branch: { sortOrder: "asc" } },
      select: {
        branchId: true,
        deliveryFeeKwd: true,
      },
    });
    if (!row) return null;
    return {
      branchId: row.branchId,
      deliveryFeeKwd: Number(row.deliveryFeeKwd),
    };
  } catch {
    return null;
  }
}

/** Customer-selected governorate + area from cookie. */
export async function getSelectedArea(): Promise<SelectedKuwaitArea | null> {
  const jar = await cookies();
  const raw = jar.get(STOREFRONT_AREA_COOKIE)?.value;
  return parseAreaCookie(raw);
}

/**
 * Branch + fee for checkout/menu: pickup cookie (no fee) or delivery area.
 */
export async function resolveStorefrontBranch(): Promise<StorefrontBranchResolution | null> {
  const pickupId = await getSelectedPickupBranchId();
  if (pickupId) {
    return { branchId: pickupId, deliveryFeeKwd: 0 };
  }
  return resolveDeliveryStorefrontBranch();
}
