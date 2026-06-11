import { prisma } from "@/lib/prisma";
import { dbQuery } from "@/lib/db-safe";
import { FALLBACK_CATEGORIES, type CategoryDTO } from "@/lib/categories";

function mapRow(row: {
  id: string;
  key: string;
  nameEn: string;
  nameAr: string;
  sectionSlug: string;
  sortOrder: number;
  isActive: boolean;
}): CategoryDTO {
  return {
    id: row.id,
    key: row.key,
    nameEn: row.nameEn,
    nameAr: row.nameAr,
    sectionSlug: row.sectionSlug,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  };
}

/**
 * Resilient lookup: returns built-in categories if the DB is down, the Prisma
 * client hasn't been regenerated, or the Category table doesn't exist yet
 * (i.e. before the migration runs). Avoids hard-crashing pages during rollout.
 */
async function loadCategories(where?: { isActive: boolean }): Promise<CategoryDTO[]> {
  // Guard against an un-regenerated client where `prisma.category` is undefined.
  if (!(prisma as { category?: unknown }).category) {
    return FALLBACK_CATEGORIES;
  }
  try {
    const rows = await dbQuery(FALLBACK_CATEGORIES, () =>
      prisma.category.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
      })
    );
    return rows.map(mapRow);
  } catch {
    // e.g. table not created yet (migration pending) — degrade gracefully.
    return FALLBACK_CATEGORIES;
  }
}

/** All active categories, ordered for display. */
export async function getActiveCategories(): Promise<CategoryDTO[]> {
  return loadCategories({ isActive: true });
}

/** Every category (including inactive) for the admin. */
export async function getAllCategoriesAdmin(): Promise<CategoryDTO[]> {
  return loadCategories();
}
