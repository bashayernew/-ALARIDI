"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/actions/admin-auth";

async function requireAdmin() {
  if (!(await isAdminSession())) throw new Error("Unauthorized");
}

export async function upsertSiteContent(
  key: string,
  valueEn: string,
  valueAr: string
) {
  await requireAdmin();
  await prisma.siteContent.upsert({
    where: { key },
    create: { key, valueEn, valueAr },
    update: { valueEn, valueAr },
  });
  revalidatePath("/");
  revalidatePath("/loyalty");
  revalidatePath("/gifts");
  revalidatePath("/checkout");
  revalidatePath("/admin/content");
}

export async function deleteSiteContent(key: string) {
  await requireAdmin();
  await prisma.siteContent.deleteMany({ where: { key } });
  revalidatePath("/");
  revalidatePath("/loyalty");
  revalidatePath("/gifts");
  revalidatePath("/checkout");
  revalidatePath("/admin/content");
}
