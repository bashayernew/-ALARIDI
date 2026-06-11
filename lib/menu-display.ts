import type { Locale } from "@/lib/i18n";
import type { MenuProduct } from "@/lib/menu-data";
import type { ProductDTO } from "@/types";
import { displayDbProduct } from "@/lib/db-product-ar";

export function displayMenuProduct(
  p: MenuProduct,
  _locale: Locale
): { name: string; description: string } {
  // Names/descriptions are localized on the server in localizeMenuPayload.
  return { name: p.name, description: p.description };
}

/** Product Arabic copy from catalog fields */
export function displayCatalogProduct(
  p: ProductDTO,
  locale: Locale
): { name: string; description: string } {
  if (locale === "en") return { name: p.name, description: p.description };
  return displayDbProduct(p, locale);
}
