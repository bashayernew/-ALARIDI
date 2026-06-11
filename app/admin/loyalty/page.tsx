import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminSession } from "@/actions/admin-auth";
import { getLoyaltySettingsAdmin } from "@/actions/loyalty-admin";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/dictionary";
import { prisma } from "@/lib/prisma";
import { dbQuery, isPrismaConnectionError } from "@/lib/db-safe";
import { LoyaltyAdmin } from "@/components/admin/loyalty-admin";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: translate(locale, "admin.nav.loyalty") };
}

export default async function AdminLoyaltyPage() {
  if (!(await isAdminSession())) redirect("/admin/login");
  const locale = await getLocale();
  const t = (k: Parameters<typeof translate>[1]) => translate(locale, k);

  let dbOffline = false;
  let settings = await getLoyaltySettingsAdmin().catch(() => {
    dbOffline = true;
    return null;
  });

  const tierCounts = await dbQuery([], async () => {
    const rows = await prisma.customer.groupBy({
      by: ["tier"],
      _count: { _all: true },
    });
    return rows.map((r) => ({
      tier: r.tier,
      count: r._count._all,
    }));
  }).catch((e) => {
    if (isPrismaConnectionError(e)) dbOffline = true;
    return [];
  });

  if (!settings) {
    const { DEFAULT_LOYALTY_SETTINGS } = await import("@/lib/loyalty-settings");
    settings = DEFAULT_LOYALTY_SETTINGS;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6">
      <h1 className="font-heading text-3xl text-foreground">
        {t("admin.loyalty.title")}
      </h1>
      <LoyaltyAdmin
        settings={settings}
        tierCounts={tierCounts}
        dbOffline={dbOffline}
      />
    </div>
  );
}
