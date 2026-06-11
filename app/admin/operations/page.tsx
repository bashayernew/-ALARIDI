import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminSession } from "@/actions/admin-auth";
import { getLocale } from "@/lib/i18n-server";
import { translate, type TranslationKey } from "@/lib/dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: translate(locale, "admin.operations.meta") };
}

const SECTIONS: TranslationKey[] = [
  "admin.operations.inventory",
  "admin.operations.customers",
  "admin.operations.promos",
  "admin.operations.giftCards",
  "admin.operations.loyalty",
  "admin.operations.reports",
];

export default async function AdminOperationsPage() {
  if (!(await isAdminSession())) redirect("/admin/login");

  const locale = await getLocale();
  const t = (key: TranslationKey) => translate(locale, key);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
      <h1 className="font-heading text-3xl">{t("admin.operations.title")}</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((sectionKey) => (
          <section key={sectionKey} className="rounded-2xl border border-border/60 bg-card/40 p-5">
            <h2 className="font-heading text-2xl">{t(sectionKey)}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("admin.operations.scaffold")}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
