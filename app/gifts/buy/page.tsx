import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchSiteContentMap } from "@/lib/site-content";
import { mergeFeatureFlagsFromContent } from "@/lib/site-content-types";
import { getLocale } from "@/lib/i18n-server";
import { translate, type TranslationKey } from "@/lib/dictionary";
import { getEnabledGiftCardProducts } from "@/lib/gift-card-products";
import { BuyGiftCardForm } from "@/components/gifts/buy-gift-card-form";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: translate(locale, "giftCard.buy.title"),
    description: translate(locale, "giftCard.buy.subtitle"),
  };
}

export default async function BuyGiftCardPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const featureFlags = mergeFeatureFlagsFromContent(await fetchSiteContentMap());
  if (!featureFlags.giftCards) notFound();

  const locale = await getLocale();
  const t = (k: TranslationKey) => translate(locale, k);
  const { id } = await searchParams;
  const products = await getEnabledGiftCardProducts(locale);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          {t("giftCard.buy.kicker")}
        </p>
        <h1 className="mt-2 font-heading text-4xl">{t("giftCard.buy.title")}</h1>
        <p className="mt-3 text-muted-foreground">
          {t("giftCard.buy.subtitle")}
        </p>
      </header>
      <BuyGiftCardForm products={products} initialProductId={id} />
    </div>
  );
}
