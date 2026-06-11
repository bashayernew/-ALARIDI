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
    <section className="border-y border-border/50 bg-card/25 py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <HomeFadeUp>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            {t("home.categories.kicker")}
          </p>
          <h2 className="mt-2 font-heading text-3xl sm:text-4xl">
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
                      "flex min-w-[148px] shrink-0 flex-col gap-2 rounded-2xl border px-4 py-4 transition-all duration-300",
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
    </section>
  );
}
