import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchSiteContentMap } from "@/lib/site-content";
import { mergeFeatureFlagsFromContent } from "@/lib/site-content-types";
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
import { PromoCoupon } from "@/components/promotions/promo-coupon";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: translate(locale, "promotions.meta.title") };
}

export default async function PromotionsPage() {
  const featureFlags = mergeFeatureFlagsFromContent(await fetchSiteContentMap());
  if (!featureFlags.promotions) notFound();

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
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {codes.map((c) => {
            const isPercent = c.discountType === "PERCENT";
            const isFixed = c.discountType === "FIXED";
            const isFree = c.discountType === "FREE_SHIPPING";
            const bigValue = isPercent
              ? `${Number(c.discountValue)}%`
              : isFixed
                ? formatKwd(Number(c.discountValue))
                : isFree
                  ? t("promotions.codes.freeShippingShort")
                  : t("promotions.codes.deal");
            const discountLabel = isPercent
              ? `${Number(c.discountValue)}% off`
              : isFixed
                ? `${formatKwd(Number(c.discountValue))} off`
                : isFree
                  ? t("promotions.codes.freeShipping")
                  : t("promotions.codes.buyXgetY");
            const appliesTo =
              c.categories.length > 0 || c.products.length > 0
                ? `${t("promotions.codes.appliesTo")}: ${[
                    ...c.categories.map((cat) =>
                      getCategoryLabel(cat.category, locale)
                    ),
                    ...c.products.map((link) =>
                      locale === "ar" && link.product.nameAr
                        ? link.product.nameAr
                        : link.product.name
                    ),
                  ].join(", ")}`
                : null;
            const minOrder = c.minOrderAmount
              ? `${t("promotions.codes.minOrder")}: ${formatKwd(
                  Number(c.minOrderAmount)
                )}`
              : null;
            const endsAt = c.endsAt
              ? `${t("promotions.codes.endsAt")}: ${c.endsAt.toLocaleDateString(
                  locale === "ar" ? "ar-KW" : "en-KW"
                )}`
              : null;
            return (
              <PromoCoupon
                key={c.id}
                code={c.code}
                bigValue={bigValue}
                discountLabel={discountLabel}
                description={c.description}
                appliesTo={appliesTo}
                minOrder={minOrder}
                endsAt={endsAt}
                checkoutNote={t("promotions.codes.checkoutOnly")}
                labelDiscount={t("promotions.codes.discountLabel")}
                copyLabel={t("promotions.codes.copy")}
                copiedLabel={t("promotions.codes.copied")}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
