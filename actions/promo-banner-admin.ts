"use server";

import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/actions/admin-auth";
import { saveUploadedImage } from "@/lib/upload-image";

async function requireAdmin() {
  if (!(await isAdminSession())) throw new Error("Unauthorized");
}

export async function uploadOfferBannerImage(
  formData: FormData
): Promise<string> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No file uploaded");
  }
  return saveUploadedImage(file, "banner-");
}

export async function createOfferBanner(input: {
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  imageUrl: string;
  linkUrl: string;
  sortOrder: number;
  enabled: boolean;
}) {
  await requireAdmin();
  await prisma.offerBanner.create({ data: input });
  revalidatePath("/");
  revalidatePath("/promotions");
  revalidatePath("/admin/banners");
}

export async function updateOfferBanner(
  id: string,
  data: Partial<{
    titleEn: string;
    titleAr: string;
    subtitleEn: string;
    subtitleAr: string;
    imageUrl: string;
    linkUrl: string;
    sortOrder: number;
    enabled: boolean;
  }>
) {
  await requireAdmin();
  await prisma.offerBanner.update({ where: { id }, data });
  revalidatePath("/");
  revalidatePath("/promotions");
  revalidatePath("/admin/banners");
}

export async function deleteOfferBanner(id: string) {
  await requireAdmin();
  await prisma.offerBanner.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/promotions");
  revalidatePath("/admin/banners");
}
