import { prisma } from "@/lib/prisma";
import type { BranchDTO } from "@/lib/branches";

/** List active branches, ordered. Returns [] if DB is offline. */
export async function listBranches(): Promise<BranchDTO[]> {
  try {
    const rows = await prisma.branch.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });
    return rows.map((b) => ({
      id: b.id,
      slug: b.slug,
      name: b.name,
      nameAr: b.nameAr,
      area: b.area,
    }));
  } catch (e) {
    console.error("[listBranches] DB query failed:", e);
    return [];
  }
}
