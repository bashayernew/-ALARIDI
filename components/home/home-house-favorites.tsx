"use client";

import Link from "next/link";
import { ProductImage } from "@/components/ui/product-image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ProductDTO } from "@/types";
import { formatKwd } from "@/lib/format";
import { HomeQuickAddButton } from "@/components/home/home-quick-add-button";
import { HomeFadeUp } from "@/components/home/home-fade-up";
import { useI18n } from "@/components/i18n/i18n-provider";
import { displayDbProduct } from "@/lib/db-product-ar";
import type { TranslationKey } from "@/lib/dictionary";
import { cn } from "@/lib/utils";

type Item = { product: ProductDTO; cardTitle: string };

type Props = {
  items: Item[];
};

function translatedCardTitle(
  cardTitle: string,
  t: (k: TranslationKey) => string
): string {
  const map: Record<string, TranslationKey> = {
    "Baklava Mix": "home.favorites.cardTitle.baklava",
    "Maamoul Dates": "home.favorites.cardTitle.maamoul",
    Kunafa: "home.favorites.cardTitle.kunafa",
    Mafrooke: "home.favorites.cardTitle.mafrooke",
  };
  const key = map[cardTitle];
  return key ? t(key) : cardTitle;
}

export function HomeHouseFavorites({ items }: Props) {
  const { t, locale, dir } = useI18n();

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <HomeFadeUp>
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              {t("home.favorites.kicker")}
            </p>
            <h2 className="mt-2 font-heading text-3xl sm:text-4xl">
              {t("home.favorites.title")}
            </h2>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              {t("home.favorites.subtitle")}
            </p>
          </div>
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            {t("home.favorites.viewMenu")}
            <ArrowRight className={cn("size-4", dir === "rtl" && "rotate-180")} />
          </Link>
        </div>
      </HomeFadeUp>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ product, cardTitle }, i) => {
          const d = displayDbProduct(product, locale);
          return (
            <motion.article
              key={product.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.5,
                delay: i * 0.07,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group flex flex-col overflow-hidden rounded-3xl border border-border/55 bg-card/45 shadow-[0_18px_50px_-28px_rgba(0,0,0,0.85)] transition-shadow duration-300 hover:border-primary/25 hover:shadow-[0_28px_70px_-24px_rgba(201,169,110,0.18)]"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <ProductImage
                  src={product.image}
                  alt={translatedCardTitle(cardTitle, t)}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-105"
                  sizes="(max-width:1024px)50vw,25vw"
                  fallbackTextClassName="text-base"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                <Badge className="absolute start-3 top-3 border border-primary/35 bg-primary/90 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground shadow-md">
                  {t("home.favorites.badge")}
                </Badge>
              </div>
              <div className="flex flex-1 flex-col p-4 sm:p-5">
                <h3 className="font-heading text-lg leading-snug sm:text-xl">
                  {translatedCardTitle(cardTitle, t)}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm">
                  {d.name}
                </p>
                <div className="mt-auto flex flex-col gap-3 pt-4">
                  <p className="font-heading text-xl text-primary tabular-nums">
                    {formatKwd(product.price)}
                  </p>
                  <HomeQuickAddButton product={product} className="w-full" size="sm" />
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>

      {items.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
          {t("home.favorites.empty", { cmd: "npm run db:seed" })}
        </p>
      )}
    </section>
  );
}
