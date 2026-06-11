import { Suspense } from "react";
import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/dictionary";
import {
  getBuilderCatalogProducts,
  getPublishedGiftBaskets,
} from "@/lib/gift-baskets";
import { getEnabledGiftCardProducts } from "@/lib/gift-card-products";
import {
  filterOccasionsWithVisibleItems,
  getEnabledGiftOccasions,
} from "@/lib/gift-occasions";
import { GiftsPageInner } from "@/components/gifts/gifts-page-inner";
import { getPickupBranches } from "@/lib/storefront-branch";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: translate(locale, "gifts.meta.title"),
    description: translate(locale, "gifts.meta.desc"),
  };
}

export default async function GiftsPage() {
  const locale = await getLocale();

  const [giftBaskets, builderProducts, giftCardProducts, allOccasions, pickupBranches] =
    await Promise.all([
      getPublishedGiftBaskets(locale),
      getBuilderCatalogProducts(locale),
      getEnabledGiftCardProducts(locale),
      getEnabledGiftOccasions(locale),
      getPickupBranches(),
    ]);

  const visibleBasketIds = new Set(giftBaskets.map((b) => b.id));
  const visibleCardIds = new Set(giftCardProducts.map((c) => c.id));
  const occasions = filterOccasionsWithVisibleItems(
    allOccasions,
    visibleBasketIds,
    visibleCardIds
  );

  return (
    <Suspense fallback={null}>
      <GiftsPageInner
        occasions={occasions}
        giftBaskets={giftBaskets}
        giftCardProducts={giftCardProducts}
        builderProducts={builderProducts}
        pickupBranches={pickupBranches}
      />
    </Suspense>
  );
}
