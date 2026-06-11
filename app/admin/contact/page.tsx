import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminSession } from "@/actions/admin-auth";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/dictionary";
import { prisma } from "@/lib/prisma";
import { dbQuery } from "@/lib/db-safe";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: translate(locale, "admin.nav.contact") };
}

export default async function AdminContactPage() {
  if (!(await isAdminSession())) redirect("/admin/login");
  const locale = await getLocale();
  const t = (k: Parameters<typeof translate>[1]) => translate(locale, k);
  const session = await getAdminSession();
  const isSuper = session?.role === "SUPER_ADMIN";

  const submissions = await dbQuery([], () =>
    prisma.contactSubmission.findMany({
      where:
        !isSuper && session?.role === "BRANCH_ADMIN" && session.branchId
          ? { branchId: session.branchId }
          : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        branch: { select: { name: true, nameAr: true } },
      },
    })
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-heading text-3xl text-foreground">
        {t("admin.contact.title")}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {isSuper
          ? t("admin.contact.noteSuper")
          : t("admin.contact.noteBranch")}
      </p>

      <div className="mt-8 space-y-3">
        {submissions.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
            {t("admin.contact.empty")}
          </p>
        ) : (
          submissions.map((s) => {
            const branchLabel =
              s.branch &&
              (locale === "ar" && s.branch.nameAr.trim()
                ? s.branch.nameAr
                : s.branch.name);
            return (
              <article
                key={s.id}
                className="rounded-2xl border border-border bg-card/40 p-4 text-sm"
              >
                <header className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-foreground">
                    {s.name}{" "}
                    <a
                      href={`mailto:${s.email}`}
                      className="text-muted-foreground hover:text-primary"
                    >
                      &lt;{s.email}&gt;
                    </a>
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(s.createdAt).toLocaleString(
                      locale === "ar" ? "ar-KW" : "en-KW"
                    )}
                  </span>
                </header>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {s.customerArea ? (
                    <span className="rounded-md bg-muted/40 px-2 py-0.5 text-muted-foreground">
                      {t("admin.contact.customerArea")}: {s.customerArea}
                    </span>
                  ) : null}
                  {isSuper ? (
                    branchLabel ? (
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-primary">
                        {t("admin.contact.branch")}: {branchLabel}
                      </span>
                    ) : (
                      <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-amber-800 dark:text-amber-200">
                        {t("admin.contact.unassigned")}
                      </span>
                    )
                  ) : null}
                </div>
                {s.phone ? (
                  <p className="mt-1 text-xs text-muted-foreground">{s.phone}</p>
                ) : null}
                {s.subject ? (
                  <p className="mt-2 font-medium text-primary">{s.subject}</p>
                ) : null}
                <p className="mt-2 whitespace-pre-line text-muted-foreground">
                  {s.message}
                </p>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
