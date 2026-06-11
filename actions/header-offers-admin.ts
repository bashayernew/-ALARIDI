"use server";

import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/actions/admin-auth";
import type { HeaderOfferPlacement } from "@prisma/client";

async function requireAdmin() {
  if (!(await isAdminSession())) throw new Error("Unauthorized");
}

export async function uploadHeaderOfferImage(
  formData: FormData
): Promise<string> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No file uploaded");
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || ".jpg";
  const name = `offer-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buf);
  return `/uploads/${name}`;
}

function parseOptionalDate(v: string | null | undefined): Date | null {
  if (!v?.trim()) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export type HeaderOfferAdminInput = {
  titleEn: string;
  titleAr: string;
  shortTextEn: string;
  shortTextAr: string;
  icon: string;
  image: string;
  ctaTextEn: string;
  ctaTextAr: string;
  ctaLink: string;
  placement: HeaderOfferPlacement;
  sortOrder: number;
  enabled: boolean;
  startsAt: string | null;
  expiresAt: string | null;
};

function toDbData(input: HeaderOfferAdminInput) {
  return {
    titleEn: input.titleEn,
    titleAr: input.titleAr,
    shortTextEn: input.shortTextEn,
    shortTextAr: input.shortTextAr,
    icon: input.icon || "sparkles",
    image: input.image || "",
    ctaTextEn: input.ctaTextEn,
    ctaTextAr: input.ctaTextAr,
    ctaLink: input.ctaLink,
    placement: input.placement,
    sortOrder: input.sortOrder,
    enabled: input.enabled,
    startsAt: parseOptionalDate(input.startsAt),
    expiresAt: parseOptionalDate(input.expiresAt),
  };
}

export async function createHeaderOffer(input: HeaderOfferAdminInput) {
  await requireAdmin();
  await prisma.headerOffer.create({ data: toDbData(input) });
  revalidateHeaderOffers();
}

export async function updateHeaderOffer(
  id: string,
  input: Partial<HeaderOfferAdminInput>
) {
  await requireAdmin();
  const data: Record<string, unknown> = {};
  if (input.titleEn !== undefined) data.titleEn = input.titleEn;
  if (input.titleAr !== undefined) data.titleAr = input.titleAr;
  if (input.shortTextEn !== undefined) data.shortTextEn = input.shortTextEn;
  if (input.shortTextAr !== undefined) data.shortTextAr = input.shortTextAr;
  if (input.icon !== undefined) data.icon = input.icon || "sparkles";
  if (input.image !== undefined) data.image = input.image || "";
  if (input.ctaTextEn !== undefined) data.ctaTextEn = input.ctaTextEn;
  if (input.ctaTextAr !== undefined) data.ctaTextAr = input.ctaTextAr;
  if (input.ctaLink !== undefined) data.ctaLink = input.ctaLink;
  if (input.placement !== undefined) data.placement = input.placement;
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
  if (input.enabled !== undefined) data.enabled = input.enabled;
  if (input.startsAt !== undefined) data.startsAt = parseOptionalDate(input.startsAt);
  if (input.expiresAt !== undefined)
    data.expiresAt = parseOptionalDate(input.expiresAt);
  await prisma.headerOffer.update({ where: { id }, data });
  revalidateHeaderOffers();
}

export async function deleteHeaderOffer(id: string) {
  await requireAdmin();
  await prisma.headerOffer.delete({ where: { id } });
  revalidateHeaderOffers();
}

function revalidateHeaderOffers() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/header-offers");
}
