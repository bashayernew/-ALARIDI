import { prisma } from "@/lib/prisma";
import { dbQuery } from "@/lib/db-safe";
import { HOUSE_FAVORITE_SLOTS } from "@/lib/home-catalog";
import { productToDTO, type ProductDTO } from "@/types";

export async function getProductBySlug(slug: string): Promise<ProductDTO | null> {
  return dbQuery(null, async () => {
    const row = await prisma.product.findUnique({ where: { slug } });
    return row ? productToDTO(row) : null;
  });
}

export async function getRelatedProducts(
  productId: string,
  category: string,
  limit = 4
): Promise<ProductDTO[]> {
  return dbQuery([], async () => {
    const list = await prisma.product.findMany({
      where: {
        category,
        isAvailable: true,
        id: { not: productId },
      },
      take: limit,
      orderBy: [{ isBestSeller: "desc" }, { name: "asc" }],
    });
    return list.map(productToDTO);
  });
}

export async function getAllProducts(): Promise<ProductDTO[]> {
  return dbQuery([], async () => {
    const list = await prisma.product.findMany({
      where: { isAvailable: true },
      orderBy: [{ isBestSeller: "desc" }, { name: "asc" }],
    });
    return list.map(productToDTO);
  });
}

export async function getBestSellers(limit = 6): Promise<ProductDTO[]> {
  return dbQuery([], async () => {
    const list = await prisma.product.findMany({
      where: { isBestSeller: true, isAvailable: true },
      take: limit,
      orderBy: { name: "asc" },
    });
    return list.map(productToDTO);
  });
}

export async function getPromoProducts(): Promise<ProductDTO[]> {
  return dbQuery([], async () => {
    const list = await prisma.product.findMany({
      where: { isPromo: true, isAvailable: true },
      orderBy: { name: "asc" },
    });
    return list.map(productToDTO);
  });
}

export async function getMooneProducts(): Promise<ProductDTO[]> {
  return dbQuery([], async () => {
    const list = await prisma.product.findMany({
      where: { category: "LEBANESE_MOONE", isAvailable: true },
      orderBy: { name: "asc" },
    });
    return list.map(productToDTO);
  });
}

/** Four curated “House favorites” cards (Baklava Mix, Maamoul Dates, Kunafa, Mafrooke). */
export async function getHouseFavoriteProducts(): Promise<
  { product: ProductDTO; cardTitle: string }[]
> {
  return dbQuery([], async () => {
    const out: { product: ProductDTO; cardTitle: string }[] = [];
    for (const slot of HOUSE_FAVORITE_SLOTS) {
      let row = null;
      for (const pat of slot.patterns) {
        row = await prisma.product.findFirst({
          where: {
            name: { contains: pat, mode: "insensitive" },
            isAvailable: true,
          },
        });
        if (row) break;
      }
      if (row) {
        out.push({ product: productToDTO(row), cardTitle: slot.cardTitle });
      }
    }
    return out;
  });
}

/** Random assortment for “Fresh today” strip (PostgreSQL `RANDOM()`). */
export async function getFreshTodayProducts(limit = 6): Promise<ProductDTO[]> {
  return dbQuery([], async () => {
    try {
      const rows = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "Product" ORDER BY RANDOM() LIMIT ${limit}
      `;
      const ids = rows.map((r) => r.id);
      if (!ids.length) return [];
      const products = await prisma.product.findMany({
        where: { id: { in: ids }, isAvailable: true },
      });
      const order = new Map(ids.map((id, i) => [id, i]));
      return products
        .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
        .map(productToDTO);
    } catch {
      const all = await prisma.product.findMany({
        where: { isAvailable: true },
      });
      const shuffled = [...all].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, limit).map(productToDTO);
    }
  });
}
