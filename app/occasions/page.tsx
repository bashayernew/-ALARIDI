import { Suspense } from "react";
import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/dictionary";
import { getPublishedGiftBaskets } from "@/lib/gift-baskets";
import { getEnabledGiftCardProducts } from "@/lib/gift-card-products";
import {
  filterOccasionsWithVisibleItems,
  getEnabledGiftOccasions,
} from "@/lib/gift-occasions";
import { OccasionsPageInner } from "@/components/gifts/occasions-page-inner";
import { getPickupBranches } from "@/lib/storefront-branch";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: translate(locale, "occasions.meta.title"),
    description: translate(locale, "occasions.meta.desc"),
  };
}

export default async function OccasionsPage() {
  const locale = await getLocale();

  const [giftBaskets, giftCardProducts, allOccasions, pickupBranches] =
    await Promise.all([
      getPublishedGiftBaskets(locale),
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
      <OccasionsPageInner
        occasions={occasions}
        giftBaskets={giftBaskets}
        pickupBranches={pickupBranches}
      />
    </Suspense>
  );
}
