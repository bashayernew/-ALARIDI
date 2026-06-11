import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminSession } from "@/actions/admin-auth";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/dictionary";
import { prisma } from "@/lib/prisma";
import { dbQuery } from "@/lib/db-safe";
import { getAllGiftOccasionsAdmin } from "@/lib/gift-occasions";
import { GiftOccasionsAdmin } from "@/components/admin/gift-occasions-admin";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: translate(locale, "admin.nav.occasions") };
}

export default async function AdminOccasionsPage() {
  if (!(await isAdminSession())) redirect("/admin/login");
  const locale = await getLocale();
  const t = (k: Parameters<typeof translate>[1]) => translate(locale, k);

  const [occasions, baskets, giftCards] = await Promise.all([
    getAllGiftOccasionsAdmin(),
    dbQuery([], () =>
      prisma.giftBasket.findMany({
        orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
        select: { id: true, nameEn: true, visibility: true },
      })
    ),
    dbQuery([], () =>
      prisma.giftCardProduct.findMany({
        orderBy: [{ sortOrder: "asc" }, { titleEn: "asc" }],
        select: { id: true, titleEn: true, enabled: true },
      })
    ),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-heading text-3xl text-foreground">
        {t("admin.occasions.title")}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("admin.occasions.note")}</p>
      <div className="mt-8">
        <GiftOccasionsAdmin
          occasions={occasions}
          baskets={baskets}
          giftCards={giftCards}
        />
      </div>
    </div>
  );
}
