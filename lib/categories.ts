import type { Locale } from "@/lib/i18n";

/** A product category key. Categories are now DB-driven; keys are stable strings. */
export type CategoryKey = string;

/** JSON-safe category for client components. */
export type CategoryDTO = {
  id: string;
  key: string;
  nameEn: string;
  nameAr: string;
  sectionSlug: string;
  sortOrder: number;
  isActive: boolean;
};

/**
 * Built-in categories. Used to seed the DB and as a fallback when the database
 * is unreachable so the storefront keeps rendering.
 */
export const FALLBACK_CATEGORIES: CategoryDTO[] = [
  { id: "cat_must_try", key: "MUST_TRY", nameEn: "Must Try", nameAr: "تجربة لازم", sectionSlug: "must-try", sortOrder: 0, isActive: true },
  { id: "cat_promo", key: "PROMO", nameEn: "Promo Items", nameAr: "عروض", sectionSlug: "promo-items", sortOrder: 1, isActive: true },
  { id: "cat_kunafa", key: "KUNAFA", nameEn: "Kunafa", nameAr: "كنافة", sectionSlug: "kunafa", sortOrder: 2, isActive: true },
  { id: "cat_bakery", key: "BAKERY", nameEn: "Bakery", nameAr: "مخبوزات", sectionSlug: "bakery", sortOrder: 3, isActive: true },
  { id: "cat_baklava", key: "BAKLAVA", nameEn: "Baklava", nameAr: "بقلاوة", sectionSlug: "baklava", sortOrder: 4, isActive: true },
  { id: "cat_basmah", key: "BASMAH", nameEn: "Basmah", nameAr: "بسمة", sectionSlug: "basmah", sortOrder: 5, isActive: true },
  { id: "cat_maamoul", key: "MAAMOUL", nameEn: "Maamoul", nameAr: "معمول", sectionSlug: "maamoul", sortOrder: 6, isActive: true },
  { id: "cat_ghraybe", key: "GHRAYBE", nameEn: "Ghraybe", nameAr: "غريبة", sectionSlug: "ghraybe", sortOrder: 7, isActive: true },
  { id: "cat_kashta_sweets", key: "KASHTA_SWEETS", nameEn: "Kashta Sweets", nameAr: "حلويات قشطة", sectionSlug: "kashta-sweets", sortOrder: 8, isActive: true },
  { id: "cat_assorted_sweets", key: "ASSORTED_SWEETS", nameEn: "Assorted Sweets", nameAr: "حلويات مشكلة", sectionSlug: "assorted-sweets", sortOrder: 9, isActive: true },
  { id: "cat_diet_sweets", key: "DIET_SWEETS", nameEn: "Diet Sweets", nameAr: "حلويات دايت", sectionSlug: "diet-sweets", sortOrder: 10, isActive: true },
  { id: "cat_lebanese_moone", key: "LEBANESE_MOONE", nameEn: "Lebanese Moone", nameAr: "مونة لبنانية", sectionSlug: "lebanese-moone", sortOrder: 11, isActive: true },
  { id: "cat_ramadan_sweets", key: "RAMADAN_SWEETS", nameEn: "Ramadan Sweets", nameAr: "حلويات رمضانية", sectionSlug: "ramadan-sweets", sortOrder: 12, isActive: false },
];

/** Static label maps (fallback only — prefer the DB-driven helpers below). */
export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  FALLBACK_CATEGORIES.map((c) => [c.key, c.nameEn])
);
export const CATEGORY_LABELS_AR: Record<string, string> = Object.fromEntries(
  FALLBACK_CATEGORIES.map((c) => [c.key, c.nameAr])
);
export const CATEGORY_SECTION_SLUG: Record<string, string> = Object.fromEntries(
  FALLBACK_CATEGORIES.map((c) => [c.key, c.sectionSlug])
);

/** Default display order of built-in category keys (fallback only). */
export const MENU_CATEGORY_ORDER: string[] = FALLBACK_CATEGORIES.map((c) => c.key);

/** Humanize an unknown key, e.g. "DIET_SWEETS" -> "Diet Sweets". */
function humanizeKey(key: string): string {
  return key
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Localized label for a category key. Pass the loaded `categories` list (from
 * getActiveCategories) for dynamic names; falls back to built-in labels.
 */
export function getCategoryLabel(
  cat: string,
  locale: Locale,
  categories?: CategoryDTO[]
): string {
  const found = categories?.find((c) => c.key === cat);
  if (found) return locale === "ar" && found.nameAr.trim() ? found.nameAr : found.nameEn;
  const fallback =
    locale === "ar" ? CATEGORY_LABELS_AR[cat] : CATEGORY_LABELS[cat];
  return fallback ?? humanizeKey(cat);
}

/** URL section slug for /menu anchors. */
export function categorySectionSlug(
  cat: string,
  categories?: CategoryDTO[]
): string {
  const found = categories?.find((c) => c.key === cat);
  if (found) return found.sectionSlug;
  return CATEGORY_SECTION_SLUG[cat] ?? cat.toLowerCase().replace(/_/g, "-");
}
