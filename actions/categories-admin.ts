"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/actions/admin-auth";

async function requireAdmin() {
  if (!(await isAdminSession())) throw new Error("Unauthorized");
}

export type CategoryForm = {
  nameEn: string;
  nameAr: string;
  sortOrder: number;
  isActive: boolean;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .slice(0, 60);
}

function keyify(s: string): string {
  return s
    .toUpperCase()
    .trim()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 60);
}

async function uniqueKey(base: string): Promise<string> {
  const root = base || "CATEGORY";
  let candidate = root;
  let n = 1;
  while (await prisma.category.findUnique({ where: { key: candidate } })) {
    n += 1;
    candidate = `${root}_${n}`;
    if (n > 25) return `${root}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }
  return candidate;
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = base || "category";
  let candidate = root;
  let n = 1;
  while (true) {
    const existing = await prisma.category.findUnique({
      where: { sectionSlug: candidate },
    });
    if (!existing || existing.id === excludeId) return candidate;
    n += 1;
    candidate = `${root}-${n}`;
    if (n > 25) return `${root}-${Math.random().toString(36).slice(2, 6)}`;
  }
}

function revalidateAll() {
  revalidatePath("/admin/products");
  revalidatePath("/admin/promos");
  revalidatePath("/menu");
  revalidatePath("/search");
  revalidatePath("/");
}

export async function createCategory(data: CategoryForm) {
  await requireAdmin();
  const nameEn = data.nameEn.trim();
  if (!nameEn) throw new Error("Category name is required");
  const key = await uniqueKey(keyify(nameEn));
  const sectionSlug = await uniqueSlug(slugify(nameEn));
  await prisma.category.create({
    data: {
      key,
      nameEn,
      nameAr: data.nameAr.trim(),
      sectionSlug,
      sortOrder: Number.isFinite(data.sortOrder) ? data.sortOrder : 0,
      isActive: data.isActive,
    },
  });
  revalidateAll();
}

export async function updateCategory(id: string, data: CategoryForm) {
  await requireAdmin();
  const nameEn = data.nameEn.trim();
  if (!nameEn) throw new Error("Category name is required");
  await prisma.category.update({
    where: { id },
    data: {
      nameEn,
      nameAr: data.nameAr.trim(),
      sortOrder: Number.isFinite(data.sortOrder) ? data.sortOrder : 0,
      isActive: data.isActive,
    },
  });
  revalidateAll();
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat) return;
  const inUse = await prisma.product.count({ where: { category: cat.key } });
  if (inUse > 0) {
    throw new Error(
      `${inUse} product(s) still use this category. Reassign them before deleting.`
    );
  }
  await prisma.category.delete({ where: { id } });
  revalidateAll();
}
