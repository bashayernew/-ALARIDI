"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Gift,
  Moon,
  Cake,
  Heart,
  Sparkles,
  PartyPopper,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { GiftOccasionDTO } from "@/lib/gift-occasions";
import type { GiftBasketDTO } from "@/lib/gift-baskets";
import type { PickupBranchOption } from "@/lib/pickup-branch";
import { GiftBasketsSection } from "@/components/gifts/gift-baskets-section";

type Props = {
  occasions: GiftOccasionDTO[];
  giftBaskets: GiftBasketDTO[];
  pickupBranches: PickupBranchOption[];
};

const OCCASION_ICONS: { match: string; icon: LucideIcon }[] = [
  { match: "ramadan", icon: Moon },
  { match: "eid", icon: Sparkles },
  { match: "birthday", icon: Cake },
  { match: "wedding", icon: Heart },
  { match: "graduat", icon: PartyPopper },
  { match: "celebrat", icon: PartyPopper },
];

function occasionIcon(name: string): LucideIcon {
  const n = name.toLowerCase();
  return OCCASION_ICONS.find((o) => n.includes(o.match))?.icon ?? Gift;
}

export function OccasionsPageInner({
  occasions,
  giftBaskets,
  pickupBranches,
}: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedSlug = searchParams.get("occasion") ?? "";

  const selectedOccasion = React.useMemo(
    () => occasions.find((o) => o.slug === selectedSlug) ?? null,
    [occasions, selectedSlug]
  );

  const filteredBaskets = React.useMemo(() => {
    if (!selectedOccasion) return giftBaskets;
    const ids = new Set(selectedOccasion.giftBasketIds);
    return giftBaskets.filter((b) => ids.has(b.id));
  }, [giftBaskets, selectedOccasion]);

  function setOccasion(slug: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set("occasion", slug);
    else params.delete("occasion");
    const q = params.toString();
    router.replace(q ? `/occasions?${q}` : "/occasions", { scroll: false });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-12 sm:px-6">
      {/* Eye-catching header */}
      <header className="relative overflow-hidden rounded-[1.75rem] border border-primary/15 bg-gradient-to-br from-primary/10 via-card/50 to-background px-5 py-12 text-center sm:px-8 sm:py-16">
        <div
          aria-hidden
          className="glow-radial pointer-events-none absolute inset-x-0 -top-24 h-56"
        />
        <div className="relative">
          <div className="flex items-center justify-center gap-3" aria-hidden>
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-primary/70" />
            <Gift className="size-5 text-primary" />
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-primary/70" />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            {t("gifts.occasions.kicker")}
          </p>
          <h1 className="text-gradient-gold mt-3 font-heading text-4xl leading-[1.03] sm:text-5xl md:text-6xl">
            {t("occasions.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            {t("occasions.subtitle")}
          </p>
        </div>
      </header>

      {occasions.length > 0 && (
        <section>
          <div className="scrollbar-none flex gap-2.5 overflow-x-auto pb-1 sm:justify-start">
            <button
              type="button"
              onClick={() => setOccasion(null)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-300",
                !selectedOccasion
                  ? "border-primary/55 bg-primary/15 text-primary gold-glow"
                  : "border-border/60 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              <Sparkles className="size-4" />
              {t("gifts.occasions.all")}
            </button>
            {occasions.map((occasion) => {
              const Icon = occasionIcon(occasion.name);
              const active = selectedOccasion?.id === occasion.id;
              return (
                <button
                  key={occasion.id}
                  type="button"
                  onClick={() => setOccasion(occasion.slug)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-300",
                    active
                      ? "border-primary/55 bg-primary/15 text-primary gold-glow"
                      : "border-border/60 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  {occasion.name}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {filteredBaskets.length > 0 ? (
        <section>
          <h2 className="font-heading text-2xl">{t("gifts.baskets.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("gifts.baskets.subtitle")}
          </p>
          <GiftBasketsSection
            baskets={filteredBaskets}
            pickupBranches={pickupBranches}
          />
        </section>
      ) : (
        <p className="rounded-2xl border border-border/50 bg-card/30 p-6 text-sm text-muted-foreground">
          {t("gifts.occasions.noResults")}
        </p>
      )}

      <div>
        <Link
          href="/gifts"
          className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
        >
          {t("occasions.backToGifts")}
        </Link>
      </div>
    </div>
  );
}
