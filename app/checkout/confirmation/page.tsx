import { Suspense } from "react";
import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/dictionary";
import { CheckoutConfirmationClient } from "@/components/checkout/checkout-confirmation-client";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: translate(locale, "checkout.confirm.metaTitle") };
}

export default function CheckoutConfirmationPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutConfirmationClient />
    </Suspense>
  );
}
