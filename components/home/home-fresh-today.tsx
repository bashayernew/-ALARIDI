"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ProductImage } from "@/components/ui/product-image";
import type { ProductDTO } from "@/types";
import { formatKwd } from "@/lib/format";
import { HomeQuickAddButton } from "@/components/home/home-quick-add-button";
import { HomeFadeUp } from "@/components/home/home-fade-up";
import { useI18n } from "@/components/i18n/i18n-provider";
import { displayDbProduct } from "@/lib/db-product-ar";
import { cn } from "@/lib/utils";

type Props = {
  products: ProductDTO[];
};

export function HomeFreshToday({ products }: Props) {
  const { t, locale, dir } = useI18n();

  return (
    <section className="bg-secondary/30 py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <HomeFadeUp>
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                {t("home.freshToday.kicker")}
              </p>
              <h2 className="mt-2 font-heading text-3xl sm:text-4xl">
                {t("home.freshToday.title")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("home.freshToday.subtitle")}
              </p>
            </div>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              {t("home.freshToday.shopAll")}
              <ArrowRight className={cn("size-4", dir === "rtl" && "rotate-180")} />
            </Link>
          </div>
        </HomeFadeUp>

        <div className="scrollbar-none flex gap-4 overflow-x-auto scroll-smooth pb-2 pt-1">
          {products.map((p, i) => {
            const d = displayDbProduct(p, locale);
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="w-[min(240px,78vw)] shrink-0 overflow-hidden rounded-2xl border border-border/50 bg-card/50 shadow-md"
              >
                <div className="relative aspect-square bg-muted">
                  <ProductImage
                    src={p.image}
                    alt={d.name}
                    fill
                    className="object-cover"
                    sizes="240px"
                  />
                </div>
                <div className="space-y-2 p-3">
                  <p className="line-clamp-2 font-medium leading-snug">{d.name}</p>
                  <p className="text-sm text-primary tabular-nums">{formatKwd(p.price)}</p>
                  <HomeQuickAddButton
                    product={p}
                    size="sm"
                    className="w-full text-xs"
                    label={t("home.freshToday.quickAdd")}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {products.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            {t("home.freshToday.empty")}
          </p>
        )}
      </div>
    </section>
  );
}
