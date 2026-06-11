"use client";

import Link from "next/link";
import { Gift, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { GiftOccasionDTO } from "@/lib/gift-occasions";
import type { GiftBasketDTO } from "@/lib/gift-baskets";
import type { GiftCardProductDTO } from "@/lib/gift-card-products";
import type { BuilderProductDTO } from "@/lib/gift-baskets";
import type { PickupBranchOption } from "@/lib/pickup-branch";
import { GiftBasketsSection } from "@/components/gifts/gift-baskets-section";
import { BuyGiftCardForm } from "@/components/gifts/buy-gift-card-form";
import { GiftBundleBuilder } from "@/components/gifts/gift-bundle-builder";

type Props = {
  occasions: GiftOccasionDTO[];
  giftBaskets: GiftBasketDTO[];
  giftCardProducts: GiftCardProductDTO[];
  builderProducts: BuilderProductDTO[];
  pickupBranches: PickupBranchOption[];
};

export function GiftsPageInner({
  occasions,
  giftBaskets,
  giftCardProducts,
  builderProducts,
  pickupBranches,
}: Props) {
  const { t } = useI18n();

  // Only baskets the admin flagged for the gifts page appear here, capped at two.
  const featuredBaskets = giftBaskets
    .filter((b) => b.showOnGiftsPage)
    .slice(0, 2);

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-12 sm:px-6">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          {t("gifts.kicker")}
        </p>
        <h1 className="mt-2 font-heading text-4xl">{t("gifts.title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("gifts.subtitle")}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/gifts/buy"
            className={cn(buttonVariants({ variant: "default" }), "rounded-xl")}
          >
            <Gift className="me-1 size-4" />
            {t("gifts.buyGiftCard")}
          </Link>
          {occasions.length > 0 && (
            <Link
              href="/occasions"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "rounded-xl"
              )}
            >
              <Sparkles className="me-1 size-4" />
              {t("gifts.occasions.cta")}
            </Link>
          )}
        </div>
      </header>

      <section>
        <h2 className="font-heading text-2xl">{t("gifts.builder.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("gifts.builder.subtitle")}
        </p>
        <div className="mt-4">
          <GiftBundleBuilder
            products={builderProducts}
            pickupBranches={pickupBranches}
          />
        </div>
      </section>

      {featuredBaskets.length > 0 && (
        <section>
          <h2 className="font-heading text-2xl">{t("gifts.baskets.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("gifts.baskets.subtitle")}
          </p>
          {/* Only admin-selected baskets appear here, capped at two. */}
          <GiftBasketsSection
            baskets={featuredBaskets}
            pickupBranches={pickupBranches}
          />
        </section>
      )}

      {/* Gift cards live only here, at the end of the gifts page. */}
      {giftCardProducts.length > 0 && (
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-heading text-2xl">{t("giftCard.buy.title")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("giftCard.buy.subtitle")}
              </p>
            </div>
            <Link
              href="/gifts/buy"
              className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
            >
              {t("giftCard.buy.viewAll")}
            </Link>
          </div>
          <div className="mt-4">
            <BuyGiftCardForm products={giftCardProducts} compact />
          </div>
        </section>
      )}
    </div>
  );
}
