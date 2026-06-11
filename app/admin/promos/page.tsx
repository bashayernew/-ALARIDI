import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminSession } from "@/actions/admin-auth";
import { prisma } from "@/lib/prisma";
import { dbQueryWithFlag } from "@/lib/db-safe";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/dictionary";
import { PromosAdmin } from "@/components/admin/promos-admin";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: translate(locale, "admin.nav.promos") };
}

export default async function AdminPromosPage() {
  if (!(await isAdminSession())) redirect("/admin/login");

  const locale = await getLocale();
  const t = (k: Parameters<typeof translate>[1]) => translate(locale, k);

  const { data: promos, usedFallback: dbOffline } = await dbQueryWithFlag(
    [],
    () =>
      prisma.promoCode.findMany({
        orderBy: { createdAt: "desc" },
        include: { products: true, categories: true },
      })
  );

  const products = await dbQueryWithFlag([], () =>
    prisma.product.findMany({
      where: { isAvailable: true },
      select: { id: true, name: true, nameAr: true, category: true },
      orderBy: { name: "asc" },
    })
  );

  // Convert Prisma Decimal columns to plain numbers so the rows can cross to
  // the client component (Decimal objects can't be serialized over RSC).
  const serializedPromos = promos.map((p) => ({
    ...p,
    discountValue: Number(p.discountValue),
    minOrderAmount: p.minOrderAmount != null ? Number(p.minOrderAmount) : null,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-heading text-3xl text-foreground">
        {t("admin.promos.title")}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("admin.promos.subtitle")}</p>
      <div className="mt-8">
        <PromosAdmin
          promos={serializedPromos}
          products={products.data}
          dbOffline={dbOffline}
        />
      </div>
    </div>
  );
}
