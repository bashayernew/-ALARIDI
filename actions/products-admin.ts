"use server";

import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/actions/admin-auth";
import { saveUploadedImage } from "@/lib/upload-image";

async function requireAdmin() {
  if (!(await isAdminSession())) throw new Error("Unauthorized");
}

export async function uploadProductImage(formData: FormData): Promise<string> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No file uploaded");
  }
  return saveUploadedImage(file);
}

export type ProductForm = {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  ingredients?: string;
  ingredientsAr?: string;
  allergens?: string[];
  price: number;
  oldPrice: number | null;
  sellByWeight?: boolean;
  price500g?: number | null;
  price1kg?: number | null;
  image: string;
  images?: string[];
  category: string;
  isBestSeller: boolean;
  isPromo: boolean;
  isCustomizable: boolean;
  isAvailable: boolean;
  isNew: boolean;
  stockQty?: number | null;
  slug?: string;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .slice(0, 80);
}

async function uniqueSlug(base: string): Promise<string> {
  const root = base || "product";
  let candidate = root;
  let n = 1;
  // Try up to 25 times — practically always succeeds on first or second try.
  while (await prisma.product.findUnique({ where: { slug: candidate } })) {
    n += 1;
    candidate = `${root}-${n}`;
    if (n > 25) {
      candidate = `${root}-${Math.random().toString(36).slice(2, 8)}`;
      break;
    }
  }
  return candidate;
}

export async function createProduct(data: ProductForm) {
  await requireAdmin();
  const slug = await uniqueSlug(
    data.slug ? slugify(data.slug) : slugify(data.name)
  );
  await prisma.product.create({
    data: {
      slug,
      name: data.name,
      nameAr: data.nameAr || "",
      description: data.description,
      descriptionAr: data.descriptionAr || "",
      ingredients: data.ingredients || "",
      ingredientsAr: data.ingredientsAr || "",
      allergens: data.allergens ?? [],
      price: data.price,
      oldPrice: data.oldPrice,
      sellByWeight: data.sellByWeight ?? true,
      price500g: data.price500g ?? null,
      price1kg: data.price1kg ?? null,
      image: data.image,
      images: data.images ?? [],
      category: data.category,
      isBestSeller: data.isBestSeller,
      isPromo: data.isPromo,
      isCustomizable: data.isCustomizable,
      isAvailable: data.isAvailable,
      isNew: data.isNew,
      stockQty: data.stockQty ?? null,
    },
  });
  revalidatePath("/menu");
  revalidatePath("/search");
  revalidatePath("/");
  revalidatePath("/admin/products");
}

export async function updateProduct(
  id: string,
  data: Partial<ProductForm>
) {
  await requireAdmin();
  const patch: Prisma.ProductUpdateInput = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.nameAr !== undefined) patch.nameAr = data.nameAr;
  if (data.description !== undefined) patch.description = data.description;
  if (data.descriptionAr !== undefined) patch.descriptionAr = data.descriptionAr;
  if (data.price !== undefined) patch.price = data.price;
  if (data.sellByWeight !== undefined) patch.sellByWeight = data.sellByWeight;
  if (data.price500g !== undefined) patch.price500g = data.price500g;
  if (data.price1kg !== undefined) patch.price1kg = data.price1kg;
  if (data.oldPrice !== undefined) patch.oldPrice = data.oldPrice;
  if (data.image !== undefined) patch.image = data.image;
  if (data.category !== undefined) patch.category = data.category;
  if (data.isBestSeller !== undefined) patch.isBestSeller = data.isBestSeller;
  if (data.isPromo !== undefined) patch.isPromo = data.isPromo;
  if (data.isCustomizable !== undefined)
    patch.isCustomizable = data.isCustomizable;
  if (data.isAvailable !== undefined) patch.isAvailable = data.isAvailable;
  if (data.isNew !== undefined) patch.isNew = data.isNew;
  if (data.ingredients !== undefined) patch.ingredients = data.ingredients;
  if (data.ingredientsAr !== undefined) patch.ingredientsAr = data.ingredientsAr;
  if (data.allergens !== undefined) patch.allergens = data.allergens;
  if (data.images !== undefined) patch.images = data.images;
  if (data.stockQty !== undefined) patch.stockQty = data.stockQty;
  if (data.slug !== undefined && data.slug.trim()) {
    patch.slug = slugify(data.slug);
  }
  await prisma.product.update({
    where: { id },
    data: patch,
  });
  revalidatePath("/menu");
  revalidatePath("/search");
  revalidatePath("/");
  revalidatePath("/admin/products");
}

export async function deleteProduct(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  // A product referenced only by FINISHED orders (delivered/picked up or
  // cancelled) can still be deleted: we detach it from those order lines
  // first. Orders keep their totals and history. Active orders block deletion.
  const activeCount = await prisma.orderItem.count({
    where: {
      productId: id,
      order: {
        status: { notIn: ["DELIVERED", "CANCELLED"] },
      },
    },
  });
  if (activeCount > 0) {
    return {
      ok: false,
      error:
        "This product is on an active order. Finish or cancel those orders first.",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.orderItem.deleteMany({ where: { productId: id } });
    await tx.branchProductAvailability.deleteMany({ where: { productId: id } });
    await tx.product.delete({ where: { id } });
  });

  revalidatePath("/menu");
  revalidatePath("/search");
  revalidatePath("/");
  revalidatePath("/admin/products");
  return { ok: true };
}
