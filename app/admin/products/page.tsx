import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminSession } from "@/actions/admin-auth";
import { prisma } from "@/lib/prisma";
import { dbQueryWithFlag } from "@/lib/db-safe";
import { ProductsAdmin } from "@/components/admin/products-admin";
import { getAllCategoriesAdmin } from "@/lib/category-data";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/dictionary";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: translate(locale, "admin.products.metaTitle") };
}

export default async function AdminProductsPage() {
  if (!(await isAdminSession())) redirect("/admin/login");

  const { data: products, usedFallback: dbOffline } = await dbQueryWithFlag(
    [],
    () =>
      prisma.product.findMany({
        orderBy: { updatedAt: "desc" },
      })
  );

  const categories = await getAllCategoriesAdmin();

  // Serialize to plain objects — Prisma Decimal/Date can't cross to a client component.
  const rows = products.map((p) => ({
    id: p.id,
    name: p.name,
    nameAr: p.nameAr,
    description: p.description,
    descriptionAr: p.descriptionAr,
    image: p.image,
    category: p.category,
    price: Number(p.price),
    isBestSeller: p.isBestSeller,
    isPromo: p.isPromo,
    isAvailable: p.isAvailable,
    isNew: p.isNew,
  }));

  return (
    <ProductsAdmin products={rows} categories={categories} dbOffline={dbOffline} />
  );
}
