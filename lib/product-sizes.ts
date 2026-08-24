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
  sellByWeight?: boolean;
}): boolean {
  // Admin-controlled flag wins when present (database products).
  if (typeof p.sellByWeight === "boolean") return p.sellByWeight;
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

/**
 * Price for a given size: the admin's custom 500g/1kg price when set,
 * otherwise the automatic multiple of the base (250 g) price.
 */
export function weightSizePrice(
  p: { price: number; price500g?: number | null; price1kg?: number | null },
  key: string
): number {
  if (key === "500g" && p.price500g != null) return p.price500g;
  if (key === "1kg" && p.price1kg != null) return p.price1kg;
  return p.price * weightSizeMultiplier(key);
}

/** One selectable size option shown on the product page. */
export type ProductSizeOption = {
  key: string;
  label: string;
  price: number;
  /** Present only for the standard auto sizes (x1/x2/x4). */
  multiplier?: number;
};

/**
 * The size options for a product: the admin's custom weight list when set,
 * otherwise the standard 250 g / 500 g / 1 kg (with custom or auto prices).
 */
export function productSizeOptions(
  p: {
    price: number;
    price500g?: number | null;
    price1kg?: number | null;
    weightOptions?: { label: string; price: number }[] | null;
  },
  locale: string
): ProductSizeOption[] {
  if (p.weightOptions && p.weightOptions.length > 0) {
    return p.weightOptions.map((o, i) => ({
      key: `w${i}`,
      label: o.label,
      price: o.price,
    }));
  }
  return WEIGHT_SIZES.map((w) => ({
    key: w.key,
    label: locale === "ar" ? w.labelAr : w.labelEn,
    price: weightSizePrice(p, w.key),
    multiplier: w.multiplier,
  }));
}
