"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Gift, Heart, Sparkles } from "lucide-react";
import { ProductImage } from "@/components/ui/product-image";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProductDTO } from "@/types";
import { formatKwd } from "@/lib/format";
import { HomeHero } from "@/components/home/home-hero";
import {
  HomeOfferBanners,
  type OfferBannerDTO,
} from "@/components/home/home-offer-banners";
import { HomeHouseFavorites } from "@/components/home/home-house-favorites";
import { HomeCategoryRail } from "@/components/home/home-category-rail";
import { HomeOffersGrid } from "@/components/home/home-offers-grid";
import { HomeFreshToday } from "@/components/home/home-fresh-today";
import { HomeFadeUp } from "@/components/home/home-fade-up";
import { useI18n } from "@/components/i18n/i18n-provider";
import { displayDbProduct } from "@/lib/db-product-ar";
import { NewsletterSignup } from "@/components/newsletter-signup";
import type { TranslationKey } from "@/lib/dictionary";

type HouseSlot = { product: ProductDTO; cardTitle: string };

type Props = {
  houseFavorites: HouseSlot[];
  freshToday: ProductDTO[];
  promoProducts: ProductDTO[];
  mooneProducts: ProductDTO[];
  newArrivals: ProductDTO[];
  offerBanners: OfferBannerDTO[];
};

export function HomeSections({
  houseFavorites,
  freshToday,
  promoProducts,
  mooneProducts,
  newArrivals,
  offerBanners,
}: Props) {
  const { t, locale } = useI18n();

  const occasions: {
    key: "celebrations" | "corporate" | "justBecause";
    icon: typeof Sparkles;
  }[] = [
    { key: "celebrations", icon: Sparkles },
    { key: "corporate", icon: Gift },
    { key: "justBecause", icon: Heart },
  ];

  return (
    <>
      <HomeHero />

      <HomeOfferBanners banners={offerBanners} />

      <HomeHouseFavorites items={houseFavorites} />

      <HomeCategoryRail />

      <HomeOffersGrid products={promoProducts} />

      <HomeFreshToday products={freshToday} />

      <section className="bg-card/20 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <HomeFadeUp>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              <span className="kicker-rule" aria-hidden />
              {t("home.new.kicker")}
            </p>
            <h2 className="mt-2 font-heading text-3xl sm:text-4xl">
              {t("home.new.title")}
            </h2>
          </HomeFadeUp>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {newArrivals.slice(0, 4).map((p) => {
              const d = displayDbProduct(p, locale);
              return (
                <div
                  key={p.id}
                  className="surface-card lift hover:lift-hover rounded-2xl p-5"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                    {t("home.new.badge")}
                  </p>
                  <p className="mt-2 font-heading text-xl text-foreground">
                    {d.name}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {d.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-secondary/40 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <HomeFadeUp>
            <div className="mb-10 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                <span className="kicker-rule" aria-hidden />
                {t("home.occasions.kicker")}
              </p>
              <h2 className="mt-2 font-heading text-3xl sm:text-4xl">
                {t("home.occasions.title")}
              </h2>
              <p className="mt-3 text-muted-foreground">
                {t("home.occasions.body")}
              </p>
            </div>
          </HomeFadeUp>
          <div className="grid gap-4 md:grid-cols-3">
            {occasions.map((c, i) => (
              <motion.div
                key={c.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="surface-card lift hover:lift-hover group rounded-3xl p-6"
              >
                <span className="mb-5 inline-flex size-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary transition group-hover:bg-primary/15">
                  <c.icon className="size-6" />
                </span>
                <h3 className="font-heading text-xl text-foreground">
                  {t(`home.occasions.${c.key}.title` as TranslationKey)}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t(`home.occasions.${c.key}.body` as TranslationKey)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <HomeFadeUp>
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                <span className="kicker-rule" aria-hidden />
                {t("home.moone.kicker")}
              </p>
              <h2 className="mt-2 font-heading text-3xl sm:text-4xl">
                {t("home.moone.title")}
              </h2>
            </div>
            <Link
              href="/menu#cat-LEBANESE_MOONE"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "rounded-xl border-primary/30"
              )}
            >
              {t("home.moone.cta")}
            </Link>
          </div>
        </HomeFadeUp>
        <div className="grid gap-4 sm:grid-cols-2">
          {mooneProducts.map((p) => {
            const d = displayDbProduct(p, locale);
            return (
              <div
                key={p.id}
                className="surface-card lift hover:lift-hover group flex flex-row-reverse gap-4 overflow-hidden rounded-3xl p-4"
              >
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-muted">
                  <ProductImage
                    src={p.image}
                    alt={d.name}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    fallbackTextClassName="text-xs"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading text-lg text-foreground">
                    {d.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {d.description}
                  </p>
                  <p className="mt-3 text-sm text-primary tabular-nums">
                    {formatKwd(p.price)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-t border-border/50 bg-card/20 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <HomeFadeUp>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              <span className="kicker-rule" aria-hidden />
              {t("home.about.kicker")}
            </p>
            <h2 className="mt-3 font-heading text-3xl sm:text-4xl">
              {t("home.about.title")}
            </h2>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("home.about.body")}
            </p>
          </HomeFadeUp>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:px-6 md:grid-cols-2">
        <div className="surface-card lift hover:lift-hover rounded-3xl border-primary/25 p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            <span className="kicker-rule" aria-hidden />
            {t("home.loyaltyBlock.kicker")}
          </p>
          <h3 className="mt-3 font-heading text-3xl text-foreground">
            {t("home.loyaltyBlock.title")}
          </h3>
          <p className="mt-3 text-muted-foreground">
            {t("home.loyaltyBlock.body")}
          </p>
          <Link
            href="/loyalty"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "mt-4 rounded-xl"
            )}
          >
            {t("home.loyaltyBlock.cta")}
          </Link>
        </div>
        <div className="surface-card lift hover:lift-hover rounded-3xl p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            <span className="kicker-rule" aria-hidden />
            {t("home.testimonials.kicker")}
          </p>
          <div className="mt-4 space-y-4 text-sm text-muted-foreground">
            <p>{t("home.testimonials.t1")}</p>
            <p>{t("home.testimonials.t2")}</p>
            <p>{t("home.testimonials.t3")}</p>
          </div>
        </div>
      </section>

      <section className="border-t border-border/50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                <span className="kicker-rule" aria-hidden />
                {t("home.instagram.kicker")}
              </p>
              <h3 className="mt-2 font-heading text-3xl">
                {t("home.instagram.title")}
              </h3>
            </div>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-sm text-primary"
            >
              @alaridi_sweets
            </a>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {["#EidBoxes", "#KunafaDaily", "#KuwaitGifting"].map((tag) => (
              <div
                key={tag}
                className="surface-card lift hover:lift-hover rounded-2xl p-5"
              >
                <p className="font-heading text-lg text-foreground">{tag}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("home.instagram.placeholder")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
        <NewsletterSignup />
      </section>
    </>
  );
}
