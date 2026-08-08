/**
 * Weight-based sizes for sweets. The stored product price is the 250 g price;
 * 500 g doubles it and 1 kg quadruples it (matches the official price list).
 * Moone items, bread, kaake kunafa, and jar products are sold as-is (no sizes).
 */
export type WeightSizeKey = "250g" | "500g" | "1kg";

export const WEIGHT_SIZES: {
  key: WeightSizeKey;
  labelEn: string;
  labelAr: string;
  multiplier: number;
}[] = [
  { key: "250g", labelEn: "250 g", labelAr: "٢٥٠ غم", multiplier: 1 },
  { key: "500g", labelEn: "500 g", labelAr: "٥٠٠ غم", multiplier: 2 },
  { key: "1kg", labelEn: "1 kg", labelAr: "١ كغ", multiplier: 4 },
];

export function weightSizeMultiplier(key: string): number {
  return WEIGHT_SIZES.find((s) => s.key === key)?.multiplier ?? 1;
}

/** Whether a product is sold by weight (250 g / 500 g / 1 kg). */
export function hasWeightSizes(p: {
  category?: string | null;
  slug?: string | null;
  name?: string | null;
}): boolean {
  if ((p.category ?? "") === "LEBANESE_MOONE") return false;
  const probe = `${p.slug ?? ""} ${p.name ?? ""}`.toLowerCase();
  if (
    probe.includes("saj") ||
    probe.includes("kaake") ||
    probe.includes("dibs") ||
    probe.includes("gift")
  ) {
    return false;
  }
  return true;
}
