/**
 * Client-safe pickup-branch types/helpers. No `next/headers` or Prisma here, so
 * this module can be imported by client components without leaking server APIs.
 */

/** Serialized for client components (pickup dropdowns). */
export type PickupBranchOption = {
  id: string;
  nameEn: string;
  nameAr: string;
  area: string;
};

export const STOREFRONT_PICKUP_BRANCH_COOKIE = "al_aridi_pickup_branch";

/** Fallback when DB branches are unavailable (pre-migration / offline). */
export const FALLBACK_PICKUP_BRANCHES: PickupBranchOption[] = [
  {
    id: "salmiya",
    nameEn: "Salmiya — Assima Mall, Qatar Street",
    nameAr: "السالمية — مجمع العاصمة، شارع قطر",
    area: "Salmiya",
  },
  {
    id: "jahra",
    nameEn: "Jahra — Sahari Mall",
    nameAr: "الجهراء — مجمع الصحاري",
    area: "Jahra",
  },
];

export function pickupBranchDisplayLabel(
  branchId: string,
  locale: "en" | "ar",
  branches: PickupBranchOption[]
): string {
  const row = branches.find((b) => b.id === branchId);
  if (!row) {
    const fb = FALLBACK_PICKUP_BRANCHES.find((b) => b.id === branchId);
    if (fb) return locale === "ar" ? fb.nameAr : fb.nameEn;
    return branchId;
  }
  return locale === "ar" && row.nameAr.trim() ? row.nameAr : row.nameEn;
}
