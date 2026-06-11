import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getLocale } from "@/lib/i18n-server";
import { translate, type TranslationKey } from "@/lib/dictionary";
import { prisma } from "@/lib/prisma";
import { dbQuery } from "@/lib/db-safe";
import { formatKwd } from "@/lib/format";
import {
  activePublicPromoWhere,
  filterActivePublicPromos,
} from "@/lib/promotions";
import { getCategoryLabel } from "@/lib/categories";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: translate(locale, "promotions.meta.title") };
}

export default async function PromotionsPage() {
  const locale = await getLocale();
  const t = (key: TranslationKey) => translate(locale, key);
  const now = new Date();

  const [banners, codeRows] = await Promise.all([
    dbQuery([], () =>
      prisma.offerBanner.findMany({
        where: { enabled: true },
        orderBy: { sortOrder: "asc" },
      })
    ),
    dbQuery([], () =>
      prisma.promoCode.findMany({
        where: activePublicPromoWhere(now),
        include: {
          categories: true,
          products: {
            include: {
              product: { select: { name: true, nameAr: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    ),
  ]);

  const codes = filterActivePublicPromos(codeRows);

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-12 sm:px-6">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          {t("promotions.kicker")}
        </p>
        <h1 className="mt-2 font-heading text-4xl">{t("promotions.title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("promotions.subtitle")}</p>
      </header>

      {banners.length > 0 && (
        <section>
          <h2 className="font-heading text-2xl">{t("promotions.banners.title")}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {banners.map((b) => {
              const title = locale === "ar" && b.titleAr ? b.titleAr : b.titleEn;
              const subtitle =
                locale === "ar" && b.subtitleAr ? b.subtitleAr : b.subtitleEn;
              return (
                <Link
                  key={b.id}
                  href={b.linkUrl || "/menu"}
                  className="relative aspect-[2/1] overflow-hidden rounded-3xl border border-primary/20 bg-card/40"
                >
                  {b.imageUrl ? (
                    <Image
                      src={b.imageUrl}
                      alt={title}
                      fill
                      sizes="(max-width:768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  ) : null}
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-background/90 via-background/40 to-transparent p-5">
                    <p className="font-heading text-2xl">{title}</p>
                    {subtitle ? (
                      <p className="text-sm text-muted-foreground">{subtitle}</p>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-heading text-2xl">{t("promotions.codes.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("promotions.codes.subtitle")}
        </p>
        {codes.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-border/60 bg-card/30 p-6 text-sm text-muted-foreground">
            {t("promotions.codes.empty")}
          </p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {codes.map((c) => {
              const label =
                c.discountType === "PERCENT"
                  ? `${Number(c.discountValue)}% off`
                  : c.discountType === "FIXED"
                    ? `${formatKwd(Number(c.discountValue))} off`
                    : c.discountType === "FREE_SHIPPING"
                      ? t("promotions.codes.freeShipping")
                      : t("promotions.codes.buyXgetY");
              return (
                <li
                  key={c.id}
                  className="rounded-2xl border border-primary/30 bg-secondary/20 p-4"
                >
                  <p className="font-mono text-lg font-bold text-primary">{c.code}</p>
                  <p className="mt-1 text-sm font-medium">{label}</p>
                  {c.description ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {c.description}
                    </p>
                  ) : null}
                  {c.categories.length > 0 || c.products.length > 0 ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("promotions.codes.appliesTo")}:{" "}
                      {[
                        ...c.categories.map((cat) =>
                          getCategoryLabel(cat.category, locale)
                        ),
                        ...c.products.map((link) =>
                          locale === "ar" && link.product.nameAr
                            ? link.product.nameAr
                            : link.product.name
                        ),
                      ].join(", ")}
                    </p>
                  ) : null}
                  {c.minOrderAmount ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("promotions.codes.minOrder")}:{" "}
                      {formatKwd(Number(c.minOrderAmount))}
                    </p>
                  ) : null}
                  {c.endsAt ? (
                    <p className="text-xs text-muted-foreground">
                      {t("promotions.codes.endsAt")}:{" "}
                      {c.endsAt.toLocaleDateString(
                        locale === "ar" ? "ar-KW" : "en-KW"
                      )}
                    </p>
                  ) : null}
                  <p className="mt-3 text-xs text-primary">
                    {t("promotions.codes.checkoutOnly")}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
