"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ProductDTO } from "@/types";
import { formatKwd, discountPercent } from "@/lib/format";
import { HomeFadeUp } from "@/components/home/home-fade-up";
import { useI18n } from "@/components/i18n/i18n-provider";
import { displayDbProduct } from "@/lib/db-product-ar";
import { cn } from "@/lib/utils";

type Props = {
  products: ProductDTO[];
};

export function HomeOffersGrid({ products }: Props) {
  const { t, locale, dir } = useI18n();
  const list = products.filter(
    (p) => p.oldPrice != null && p.oldPrice > p.price
  );

  return (
    <section className="mx-auto max-w-6xl overflow-x-clip px-4 py-12 sm:px-6 sm:py-16 md:py-24">
      <HomeFadeUp>
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="border border-red-500/35 bg-red-500/15 text-red-400">
              {t("home.promos.badge")}
            </Badge>
            <h2 className="font-heading text-3xl leading-[1.08] sm:text-4xl lg:text-5xl">
              {t("home.promos.title")}
            </h2>
          </div>
          <Link
            href="/menu#cat-PROMO"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            {t("home.promos.cta")}
            <ArrowRight className={cn("size-4", dir === "rtl" && "rotate-180")} />
          </Link>
        </div>
      </HomeFadeUp>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {list.slice(0, 6).map((p, i) => {
          const pct =
            p.oldPrice != null ? discountPercent(p.price, p.oldPrice) : 0;
          const d = displayDbProduct(p, locale);
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.06, duration: 0.45 }}
              whileHover={{ y: -3 }}
              className="group overflow-hidden rounded-3xl border border-border/55 bg-card/50 shadow-[0_16px_50px_-28px_rgba(0,0,0,0.75)] transition hover:border-primary/25"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <Image
                  src={p.image}
                  alt={d.name}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="(max-width:768px)100vw,33vw"
                />
                <Badge className="absolute start-3 top-3 border border-red-400/50 bg-red-600/90 text-xs font-bold text-white shadow-md">
                  {t("menu.card.percentOff", { pct })}
                </Badge>
              </div>
              <div className="space-y-2 p-4 sm:p-5">
                <h3 className="font-heading text-lg leading-snug">{d.name}</h3>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-heading text-xl text-primary tabular-nums">
                    {formatKwd(p.price)}
                  </span>
                  {p.oldPrice != null && (
                    <span className="text-sm text-red-400/90 line-through tabular-nums decoration-red-400/60">
                      {formatKwd(p.oldPrice)}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {list.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
          {t("home.promos.empty")}
        </p>
      )}
    </section>
  );
}
