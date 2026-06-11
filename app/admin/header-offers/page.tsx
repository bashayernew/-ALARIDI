import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminSession } from "@/actions/admin-auth";
import { prisma } from "@/lib/prisma";
import { dbQueryWithFlag } from "@/lib/db-safe";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/dictionary";
import { HeaderOffersAdmin } from "@/components/admin/header-offers-admin";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: translate(locale, "admin.nav.headerOffers") };
}

export default async function AdminHeaderOffersPage() {
  if (!(await isAdminSession())) redirect("/admin/login");

  const locale = await getLocale();
  const t = (k: Parameters<typeof translate>[1]) => translate(locale, k);

  const { data: offers, usedFallback: dbOffline } = await dbQueryWithFlag(
    [],
    () =>
      prisma.headerOffer.findMany({
        orderBy: [{ placement: "asc" }, { sortOrder: "asc" }],
      })
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-heading text-3xl text-foreground">
        {t("admin.headerOffers.title")}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("admin.headerOffers.subtitle")}
      </p>
      <div className="mt-8">
        <HeaderOffersAdmin offers={offers} dbOffline={dbOffline} />
      </div>
    </div>
  );
}
