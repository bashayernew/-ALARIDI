"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          {t("gifts.occasions.kicker")}
        </p>
        <h1 className="mt-2 font-heading text-4xl">{t("occasions.title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("occasions.subtitle")}</p>
      </header>

      {occasions.length > 0 && (
        <section>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setOccasion(null)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition",
                !selectedOccasion
                  ? "border-primary/50 bg-primary/10 text-foreground"
                  : "border-border/60 bg-card/40 hover:border-primary/40"
              )}
            >
              {t("gifts.occasions.all")}
            </button>
            {occasions.map((occasion) => (
              <button
                key={occasion.id}
                type="button"
                onClick={() => setOccasion(occasion.slug)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition",
                  selectedOccasion?.id === occasion.id
                    ? "border-primary/50 bg-primary/10 text-foreground"
                    : "border-border/60 bg-card/40 hover:border-primary/40"
                )}
              >
                {occasion.name}
              </button>
            ))}
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
