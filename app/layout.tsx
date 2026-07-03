import type { Metadata } from "next";
import Script from "next/script";
import {
  Playfair_Display,
  Inter,
  Geist_Mono,
  Noto_Sans_Arabic,
} from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { StorefrontOnly } from "@/components/layout/storefront-only";
import { MainArea } from "@/components/layout/main-area";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { THEME_INIT_SCRIPT } from "@/lib/theme-script";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { MobileCartBar } from "@/components/cart/mobile-cart-bar";
import { FloatingSocials } from "@/components/FloatingSocials";
import { isRtl } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { fetchSiteContentMap } from "@/lib/site-content";
import {
  fetchActiveHeaderOffers,
  groupHeaderOffersByPlacement,
} from "@/lib/header-offers";
import { resolveStorefrontBranchId } from "@/lib/order-branch";
import { getSelectedArea } from "@/lib/storefront-branch";
import { resolveStorefrontWhatsappUrl } from "@/lib/branch-whatsapp";
import { areaDisplayLabel } from "@/lib/kuwait-areas";
import { getServedAreas } from "@/lib/served-areas";
import { HeaderOffersProvider } from "@/components/header-offers/header-offers-provider";
import { HeaderAnnouncementBar } from "@/components/layout/header-announcement-bar";
import { HeaderOverlay } from "@/components/layout/header-overlay";
import { mergeSocialUrlsFromContent } from "@/lib/site-content-types";
import { getCurrentCustomer } from "@/lib/customer-auth/server";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Al Aridi Sweets | Premium Lebanese Sweets Kuwait",
    template: "%s · Al Aridi Sweets",
  },
  description:
    "Premium Lebanese sweets, kunafa, baklava, gift trays, and artisan moone — delivered across Kuwait.",
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const rtl = isRtl(locale);
  const siteContentMap = await fetchSiteContentMap();
  const socialUrls = mergeSocialUrlsFromContent(siteContentMap);
  const initialUser = await getCurrentCustomer();
  const selectedArea = await getSelectedArea();
  const areaLabel = selectedArea
    ? areaDisplayLabel(selectedArea, locale)
    : null;
  const servedAreas = await getServedAreas();
  const storefrontBranchId = await resolveStorefrontBranchId();
  // Route WhatsApp links to the customer's branch number when that branch has one.
  socialUrls.whatsapp = await resolveStorefrontWhatsappUrl(
    storefrontBranchId,
    socialUrls.whatsapp
  );
  const headerOfferRows = await fetchActiveHeaderOffers(storefrontBranchId);
  const headerOffers = groupHeaderOffersByPlacement(headerOfferRows, locale);

  return (
    <html
      lang={locale}
      dir={rtl ? "rtl" : "ltr"}
      className={`${inter.variable} ${geistMono.variable} ${playfair.variable} ${notoArabic.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <script
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        {/* Google Analytics */}
        {GA_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
            </Script>
          </>
        ) : null}

        {/* Meta Pixel */}
        {META_PIXEL_ID ? (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`}
          </Script>
        ) : null}

        <ThemeProvider>
        <Providers
          initialLocale={locale}
          siteContentOverrides={siteContentMap}
          socialUrls={socialUrls}
          initialUser={initialUser}
        >
          <HeaderOffersProvider offers={headerOffers}>
            <StorefrontOnly>
              <HeaderOverlay>
                <HeaderAnnouncementBar />
                <SiteHeader
                  selectedArea={selectedArea}
                  areaLabel={areaLabel}
                  servedAreas={servedAreas}
                  promptAreaOnMount={!selectedArea}
                />
              </HeaderOverlay>
            </StorefrontOnly>
            <MainArea>{children}</MainArea>
            <StorefrontOnly>
              <SiteFooter />
              <CartDrawer />
              <MobileCartBar />
              <FloatingSocials />
            </StorefrontOnly>
          </HeaderOffersProvider>
        </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
