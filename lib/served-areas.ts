import "server-only";

import { prisma } from "@/lib/prisma";

export type ServedArea = { governorateKey: string; areaKey: string };

/**
 * Distinct areas that at least one ACTIVE branch delivers to (enabled rows in
 * BranchDeliveryArea). Drives which areas the storefront area picker offers.
 * Returns [] on error (pre-migration) so the picker can fall back to the full list.
 */
export async function getServedAreas(): Promise<ServedArea[]> {
  try {
    const rows = await prisma.branchDeliveryArea.findMany({
      where: { enabled: true, branch: { active: true } },
      select: { governorate: true, area: true },
      distinct: ["governorate", "area"],
    });
    return rows.map((r) => ({
      governorateKey: r.governorate,
      areaKey: r.area,
    }));
  } catch {
    return [];
  }
}
