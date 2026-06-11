import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminSession } from "@/actions/admin-auth";
import { prisma } from "@/lib/prisma";
import { dbQueryWithFlag } from "@/lib/db-safe";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/dictionary";
import { BannersAdmin } from "@/components/admin/banners-admin";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: translate(locale, "admin.nav.banners") };
}

export default async function AdminBannersPage() {
  if (!(await isAdminSession())) redirect("/admin/login");

  const locale = await getLocale();
  const t = (k: Parameters<typeof translate>[1]) => translate(locale, k);

  const { data: banners, usedFallback: dbOffline } = await dbQueryWithFlag(
    [],
    () =>
      prisma.offerBanner.findMany({
        orderBy: { sortOrder: "asc" },
      })
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-heading text-3xl text-foreground">
        {t("admin.banners.title")}
      </h1>
      <div className="mt-8">
        <BannersAdmin banners={banners} dbOffline={dbOffline} />
      </div>
    </div>
  );
}
