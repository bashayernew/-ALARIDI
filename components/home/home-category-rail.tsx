"use client";

import * as React from "react";
import Link from "next/link";
import {
  Candy,
  Cookie,
  Croissant,
  Flame,
  Layers,
  Leaf,
  Package,
  Percent,
  Sparkles,
  UtensilsCrossed,
  IceCreamBowl,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  MENU_CATEGORY_ORDER,
  getCategoryLabel,
  type CategoryDTO,
} from "@/lib/categories";
import { HomeFadeUp } from "@/components/home/home-fade-up";
import { HorizontalScrollHints } from "@/components/ui/horizontal-scroll-hints";
import { useI18n } from "@/components/i18n/i18n-provider";

const ICONS: Record<string, LucideIcon> = {
  MUST_TRY: Sparkles,
  PROMO: Percent,
  KUNAFA: Flame,
  BAKERY: Croissant,
  BAKLAVA: Layers,
  BASMAH: Package,
  MAAMOUL: Cookie,
  GHRAYBE: Candy,
  KASHTA_SWEETS: IceCreamBowl,
  ASSORTED_SWEETS: Package,
  DIET_SWEETS: Leaf,
  LEBANESE_MOONE: UtensilsCrossed,
};
const DEFAULT_ICON: LucideIcon = Tag;

/** Optional dynamic categories; falls back to the built-in keys when omitted. */
export function HomeCategoryRail({
  categories,
}: {
  categories?: CategoryDTO[];
}) {
  const { locale, t } = useI18n();
  const categoryKeys =
    categories && categories.length > 0
      ? categories.map((c) => c.key)
      : MENU_CATEGORY_ORDER;
  const [active, setActive] = React.useState<string | null>(
    categoryKeys[0] ?? null
  );

  return (
    <section className="overflow-x-clip px-4 py-12 sm:px-6 sm:py-16 md:py-24">
      <div className="relative mx-auto max-w-6xl">
        {/* Tilted gold frame accent (rotation) */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-1 -z-10 rotate-[1.5deg] rounded-[2.2rem] border border-primary/25 sm:-inset-3"
        />
        {/* Distinct framed panel with rotation accent */}
        <div className="relative overflow-hidden rounded-[1.75rem] border border-primary/15 bg-gradient-to-br from-secondary/55 via-card/40 to-background p-5 sm:rounded-[2rem] sm:p-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 starfield opacity-70"
          />
          <div className="relative">
        <HomeFadeUp>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            {t("home.categories.kicker")}
          </p>
          <h2 className="mt-2 font-heading text-3xl leading-[1.08] sm:text-4xl lg:text-5xl">
            {t("home.categories.title")}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {t("home.categories.subtitle")}
          </p>
        </HomeFadeUp>

        <HomeFadeUp delay={0.08}>
          <HorizontalScrollHints
            className="mt-8 min-w-0"
            scrollerClassName="flex gap-3 pb-3 pt-1"
            edgeFadeClassName="from-background/92 via-background/50"
          >
            {categoryKeys.map((cat) => {
              const Icon = ICONS[cat] ?? DEFAULT_ICON;
              const isActive = active === cat;
              const label = getCategoryLabel(cat, locale, categories);
              return (
                <motion.div key={cat} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href={`/menu#cat-${cat}`}
                    onClick={() => setActive(cat)}
                    className={cn(
                      "flex min-h-11 min-w-[128px] shrink-0 flex-col gap-2 rounded-2xl border px-3.5 py-3.5 transition-all duration-300 sm:min-w-[148px] sm:px-4 sm:py-4",
                      isActive
                        ? "border-primary/55 bg-primary/12 gold-glow shadow-lg"
                        : "border-border/55 bg-background/55 hover:border-primary/45 hover:bg-primary/8 hover:shadow-[0_0_0_1px_rgba(201,169,110,0.25),0_12px_40px_-12px_rgba(201,169,110,0.35)]"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-6",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs font-semibold uppercase tracking-wider",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {label}
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </HorizontalScrollHints>
        </HomeFadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}
