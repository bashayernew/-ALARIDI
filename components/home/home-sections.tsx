"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Gift, Heart, Sparkles } from "lucide-react";
import { ProductImage } from "@/components/ui/product-image";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProductDTO } from "@/types";
import { formatKwd } from "@/lib/format";
import { HomeHero } from "@/components/home/home-hero";
import { HeaderFeatureStrip } from "@/components/layout/header-feature-strip";
import {
  HomeOfferBanners,
  type OfferBannerDTO,
} from "@/components/home/home-offer-banners";
import { HomeHouseFavorites } from "@/components/home/home-house-favorites";
import { HomeFeatures } from "@/components/home/home-features";
import { HomeGallery } from "@/components/home/home-gallery";
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
  offerBanners: OfferBannerDTO[];
};

export function HomeSections({
  houseFavorites,
  freshToday,
  promoProducts,
  mooneProducts,
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

      <HeaderFeatureStrip />

      <HomeOfferBanners banners={offerBanners} />

      <HomeHouseFavorites items={houseFavorites} />

      <HomeFeatures />

      <HomeCategoryRail />

      <HomeOffersGrid products={promoProducts} />

      <HomeFreshToday products={freshToday} />

      <section className="bg-secondary/40 py-12 sm:py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <HomeFadeUp>
            <div className="mb-10 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                <span className="kicker-rule" aria-hidden />
                {t("home.occasions.kicker")}
              </p>
              <h2 className="mt-2 font-heading text-3xl leading-[1.08] sm:text-4xl lg:text-5xl">
                {t("home.occasions.title")}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">
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

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 md:py-24">
        <HomeFadeUp>
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                <span className="kicker-rule" aria-hidden />
                {t("home.moone.kicker")}
              </p>
              <h2 className="mt-2 font-heading text-3xl leading-[1.08] sm:text-4xl lg:text-5xl">
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

      <section className="border-t border-border/50 bg-card/20 py-12 sm:py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <HomeFadeUp>
            <motion.div
              initial={{ opacity: 0, scale: 1.04 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="group relative aspect-[5/4] overflow-hidden rounded-[2rem] border border-primary/15 shadow-[0_30px_70px_-40px_rgba(120,80,20,0.55)]"
            >
              <Image
                src="/mixedbaklawa.jpg"
                alt={t("home.about.title")}
                fill
                className="object-cover transition duration-700 group-hover:scale-105"
                sizes="(max-width:1024px)100vw,50vw"
              />
            </motion.div>
          </HomeFadeUp>
          <HomeFadeUp delay={0.1}>
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                <span className="kicker-rule" aria-hidden />
                {t("home.about.kicker")}
              </p>
              <h2 className="mt-3 font-heading text-3xl leading-[1.08] sm:text-4xl lg:text-5xl">
                {t("home.about.title")}
              </h2>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:mt-6 sm:text-base md:text-lg">
                {t("home.about.body")}
              </p>
              <div className="mt-7 h-px w-24 bg-gradient-to-r from-primary/60 to-transparent" />
            </div>
          </HomeFadeUp>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-12 sm:gap-6 sm:px-6 sm:py-16 md:grid-cols-2 md:py-20">
        <div className="surface-card lift hover:lift-hover rounded-3xl border-primary/25 p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            <span className="kicker-rule" aria-hidden />
            {t("home.loyaltyBlock.kicker")}
          </p>
          <h3 className="mt-3 font-heading text-2xl text-foreground sm:text-3xl">
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

      <HomeGallery />

      <section className="mx-auto max-w-4xl px-4 pb-12 sm:px-6 sm:pb-16">
        <NewsletterSignup />
      </section>
    </>
  );
}
