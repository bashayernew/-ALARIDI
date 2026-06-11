"use client";

import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import { CustomerAuthProvider } from "@/components/auth/customer-auth-provider";
import { SiteExtrasProvider } from "@/components/site-extras-provider";
import type { Locale } from "@/lib/i18n";
import type {
  SiteContentOverrideMap,
  SocialUrlKey,
} from "@/lib/site-content-types";
import type { PublicCustomer } from "@/lib/customer-auth/types";

export function Providers({
  children,
  initialLocale,
  siteContentOverrides,
  socialUrls,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
  siteContentOverrides?: SiteContentOverrideMap;
  socialUrls: Record<SocialUrlKey, string>;
  initialUser?: PublicCustomer | null;
}) {
  return (
    <I18nProvider
      initialLocale={initialLocale}
      siteContentOverrides={siteContentOverrides}
    >
      <SiteExtrasProvider socialUrls={socialUrls}>
        <CustomerAuthProvider initialUser={initialUser}>
          {children}
          <Toaster position="top-center" richColors closeButton />
        </CustomerAuthProvider>
      </SiteExtrasProvider>
    </I18nProvider>
  );
}
