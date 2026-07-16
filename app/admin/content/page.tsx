import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminSession } from "@/actions/admin-auth";
import { getAdminSession } from "@/lib/admin-session";
import { mergeFeatureFlagsFromContent } from "@/lib/site-content-types";
import { FeatureFlagsAdmin } from "@/components/admin/feature-flags-admin";
import { prisma } from "@/lib/prisma";
import { dbQueryWithFlag } from "@/lib/db-safe";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/dictionary";
import type { SiteContentOverrideMap } from "@/lib/site-content-types";
import { SiteContentAdmin } from "@/components/admin/site-content-admin";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: translate(locale, "admin.nav.content") };
}

export default async function AdminContentPage() {
  if (!(await isAdminSession())) redirect("/admin/login");
  const session = await getAdminSession();
  const isSuperAdmin = session?.role === "SUPER_ADMIN";

  const locale = await getLocale();
  const t = (k: Parameters<typeof translate>[1]) => translate(locale, k);

  const { data: rows, usedFallback: dbOffline } = await dbQueryWithFlag(
    [],
    () => prisma.siteContent.findMany()
  );

  const initialMap: SiteContentOverrideMap = {};
  for (const r of rows) {
    initialMap[r.key] = { valueEn: r.valueEn, valueAr: r.valueAr };
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-heading text-3xl text-foreground">
        {t("admin.content.title")}
      </h1>
      {isSuperAdmin ? (
        <div className="mt-8">
          <FeatureFlagsAdmin initial={mergeFeatureFlagsFromContent(initialMap)} />
        </div>
      ) : null}
      <div className="mt-8">
        <SiteContentAdmin initialMap={initialMap} dbOffline={dbOffline} />
      </div>
    </div>
  );
}
