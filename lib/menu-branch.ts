import { prisma } from "@/lib/prisma";
import type { MenuProductBilingual, MenuFullPagePayload } from "@/lib/menu-public-data";

type AvailabilityRow = {
  productId: string;
  available: boolean;
  priceOverride: { toString(): string } | number | null;
};

function applyAvailabilityToProduct(
  product: MenuProductBilingual,
  row: AvailabilityRow | undefined
): MenuProductBilingual | null {
  if (row && !row.available) return null;
  if (!row?.priceOverride) return product;
  const price = Number(row.priceOverride);
  return { ...product, price };
}

export async function loadBranchAvailabilityMap(
  branchId: string
): Promise<Map<string, AvailabilityRow>> {
  const rows = await prisma.branchProductAvailability.findMany({
    where: { branchId },
  });
  return new Map(rows.map((r) => [r.productId, r]));
}

/** Apply branch availability + price overrides to a product-backed menu payload. */
export async function applyBranchToMenuPayload(
  payload: MenuFullPagePayload,
  branchId: string | null
): Promise<MenuFullPagePayload> {
  if (!branchId) return payload;

  const map = await loadBranchAvailabilityMap(branchId);
  const sections = payload.sections
    .map((sec) => ({
      ...sec,
      products: sec.products
        .map((p) => applyAvailabilityToProduct(p, map.get(p.id)))
        .filter((p): p is MenuProductBilingual => p != null),
    }))
    .filter((sec) => sec.products.length > 0);

  return { sections };
}
