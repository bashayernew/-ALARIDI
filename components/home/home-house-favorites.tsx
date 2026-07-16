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
    <section className="mx-auto max-w-6xl overflow-x-clip px-4 py-12 sm:px-6 sm:py-16 md:py-24">
      <HomeFadeUp>
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              {t("home.favorites.kicker")}
            </p>
            <h2 className="mt-2 font-heading text-3xl leading-[1.08] sm:text-4xl lg:text-5xl">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
        {items.map(({ product, cardTitle }, i) => {
          const d = displayDbProduct(product, locale);
          const hasDiscount =
            product.oldPrice != null && product.oldPrice > product.price;
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
              whileHover={{ y: -5 }}
              className="group flex flex-col overflow-hidden rounded-3xl border border-border/40 bg-card/30 text-center backdrop-blur-sm transition-colors duration-300 hover:border-primary/30 hover:bg-card/55"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted/40">
                <ProductImage
                  src={product.image}
                  alt={translatedCardTitle(cardTitle, t)}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-110"
                  sizes="(max-width:1024px)50vw,25vw"
                  fallbackTextClassName="text-base"
                />
                <Badge className="absolute start-3 top-3 border border-primary/35 bg-primary/90 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground shadow-md">
                  {t("home.favorites.badge")}
                </Badge>
                {hasDiscount && (
                  <span className="absolute end-3 top-3 inline-flex items-center rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">
                    Sale
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col items-center p-5">
                <h3 className="font-sans text-2xl font-semibold leading-snug tracking-tight">
                  {translatedCardTitle(cardTitle, t)}
                </h3>
                <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                  {d.name}
                </p>
                <div className="mt-3 flex items-baseline justify-center gap-2">
                  <span className="font-sans text-base font-semibold text-primary tabular-nums">
                    {formatKwd(product.price)}
                  </span>
                  {hasDiscount && (
                    <span className="text-sm text-muted-foreground line-through tabular-nums">
                      {formatKwd(product.oldPrice!)}
                    </span>
                  )}
                </div>
                {/* Smooth reveal on hover (always shown on touch devices) */}
                <div className="mt-3 w-full max-h-0 overflow-hidden opacity-0 transition-all duration-300 group-hover:max-h-16 group-hover:opacity-100 [@media(hover:none)]:max-h-16 [@media(hover:none)]:opacity-100">
                  <HomeQuickAddButton
                    product={product}
                    className="w-full"
                    size="sm"
                  />
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
