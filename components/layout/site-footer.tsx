"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone } from "lucide-react";
import { BRAND_PATHS } from "@/components/FloatingSocials";
import { useI18n } from "@/components/i18n/i18n-provider";
import {
  useFeatureFlags,
  useSocialUrls,
} from "@/components/site-extras-provider";
import { DEFAULT_SOCIAL_URLS } from "@/lib/site-content-types";
import type { TranslationKey } from "@/lib/dictionary";

const EXPLORE: { href: string; key: TranslationKey }[] = [
  { href: "/menu", key: "footer.fullMenu" },
  { href: "/gifts", key: "nav.gifts" },
  { href: "/promotions", key: "nav.promotions" },
  { href: "/loyalty", key: "footer.loyaltyRewards" },
  { href: "/about", key: "nav.about" },
  { href: "/contact", key: "nav.contact" },
];

const ACCOUNT: { href: string; key: TranslationKey }[] = [
  { href: "/account", key: "nav.account" },
  { href: "/login", key: "nav.auth.login" },
  { href: "/register", key: "nav.auth.register" },
];

export function SiteFooter() {
  const { t } = useI18n();
  const flags = useFeatureFlags();
  const explore = EXPLORE.filter((l) => {
    if (l.href === "/promotions") return flags.promotions;
    if (l.href === "/gifts") return flags.giftCards || flags.giftBaskets;
    return true;
  });
  const urls = useSocialUrls() ?? DEFAULT_SOCIAL_URLS;

  const socials = [
    { href: urls.instagram, label: "Instagram", path: BRAND_PATHS.instagram },
    { href: urls.tiktok, label: "TikTok", path: BRAND_PATHS.tiktok },
    { href: urls.snapchat, label: "Snapchat", path: BRAND_PATHS.snapchat },
    { href: urls.whatsapp, label: "WhatsApp", path: BRAND_PATHS.whatsapp },
  ];

  return (
    <footer className="relative mt-14 overflow-hidden border-t border-primary/15 bg-gradient-to-b from-card/60 via-background to-background sm:mt-20">
      {/* Ambient gold glow */}
      <div
        aria-hidden
        className="glow-radial pointer-events-none absolute inset-x-0 -top-24 h-48"
      />

      <div className="relative mx-auto max-w-6xl py-14 pe-5 ps-16 sm:py-20 sm:pe-6 xl:ps-6">
        <div className="grid gap-10 sm:grid-cols-2 sm:gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Image
              src="/logo-white.png"
              alt="Al Aridi Sweets"
              width={550}
              height={262}
              className="h-24 w-auto sm:h-28"
            />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {t("footer.tagline")}
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {socials.map(({ href, label, path }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="inline-flex size-10 items-center justify-center rounded-full border border-primary/25 text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/10 hover:text-primary"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="size-[18px]"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d={path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {t("footer.explore")}
            </p>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              {explore.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="transition-colors hover:text-foreground"
                  >
                    {t(l.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {t("footer.contact")}
            </p>
            <ul className="space-y-4 text-sm">
              <li>
                <p className="font-medium text-foreground/90">Salmiya</p>
                <a
                  href="tel:+96590090892"
                  className="mt-0.5 inline-flex items-center gap-1.5 text-muted-foreground transition hover:text-primary"
                >
                  <Phone className="size-3.5" /> +965 9009 0892
                </a>
              </li>
              <li>
                <p className="font-medium text-foreground/90">Jahra</p>
                <a
                  href="tel:+96590090132"
                  className="mt-0.5 inline-flex items-center gap-1.5 text-muted-foreground transition hover:text-primary"
                >
                  <Phone className="size-3.5" /> +965 9009 0132
                </a>
              </li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1.5">
              {ACCOUNT.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-xs text-muted-foreground transition hover:text-foreground"
                >
                  {t(l.key)}
                </Link>
              ))}
            </div>
          </div>

          {/* Locations */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {t("footer.locations")}
            </p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary/70" />
                Assima Mall, Salmiya — Qatar Street
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary/70" />
                Jahra Sahari Mall
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary/70" />
                Agaila — Gate Mall
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative border-t border-border/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 pt-6 pb-24 text-xs text-muted-foreground sm:flex-row sm:px-6 sm:py-6">
          <p className="text-center sm:text-start">
            © {new Date().getFullYear()} Al Aridi Sweets. {t("footer.rights")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
            <Link href="/privacy-policy" className="transition hover:text-foreground">
              {t("footer.privacy")}
            </Link>
            <Link href="/refund-policy" className="transition hover:text-foreground">
              {t("footer.refund")}
            </Link>
            <Link
              href="/terms-and-conditions"
              className="transition hover:text-foreground"
            >
              {t("footer.terms")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
