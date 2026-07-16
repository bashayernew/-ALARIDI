"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/actions/admin-auth";
import { getAdminSession } from "@/lib/admin-session";
import type { FeatureFlagKey } from "@/lib/site-content-types";

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

/** Super-admin only: turn a storefront feature on/off (gift cards, baskets, promotions). */
export async function setFeatureFlag(key: FeatureFlagKey, enabled: boolean) {
  const session = await getAdminSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    throw new Error("Forbidden: only the super admin can change store features.");
  }
  const contentKey = `feature.${key}`;
  const value = enabled ? "on" : "off";
  await prisma.siteContent.upsert({
    where: { key: contentKey },
    create: { key: contentKey, valueEn: value, valueAr: value },
    update: { valueEn: value, valueAr: value },
  });
  revalidatePath("/", "layout");
  revalidatePath("/gifts");
  revalidatePath("/promotions");
  revalidatePath("/admin/content");
}
