import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminSession } from "@/actions/admin-auth";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/dictionary";
import { prisma } from "@/lib/prisma";
import { dbQuery } from "@/lib/db-safe";
import { getAllGiftBasketsAdmin } from "@/lib/gift-baskets";
import { GiftBasketsAdmin } from "@/components/admin/gift-baskets-admin";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: translate(locale, "admin.nav.giftBaskets") };
}

export default async function AdminGiftBasketsPage() {
  if (!(await isAdminSession())) redirect("/admin/login");
  const locale = await getLocale();
  const t = (k: Parameters<typeof translate>[1]) => translate(locale, k);

  const [baskets, products, occasions] = await Promise.all([
    getAllGiftBasketsAdmin(),
    dbQuery([], () =>
      prisma.product.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, price: true, isAvailable: true },
      })
    ),
    dbQuery([], () =>
      prisma.giftOccasion.findMany({
        orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
        select: { id: true, nameEn: true },
      })
    ),
  ]);

  // Serialize Decimal price to a number before passing to the client component.
  const productRows = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    isAvailable: p.isAvailable,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-heading text-3xl text-foreground">
        {t("admin.giftBaskets.title")}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("admin.giftBaskets.note")}</p>
      <div className="mt-8">
        <GiftBasketsAdmin
          baskets={baskets}
          products={productRows}
          occasions={occasions}
        />
      </div>
    </div>
  );
}
