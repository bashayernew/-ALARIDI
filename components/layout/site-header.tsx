"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingBag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { cn } from "@/lib/utils";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useI18n } from "@/components/i18n/i18n-provider";
import { useCustomerAuth } from "@/components/auth/customer-auth-provider";
import {
  StorefrontAreaPicker,
  type ServedArea,
} from "@/components/layout/storefront-area-picker";
import type { SelectedKuwaitArea } from "@/lib/kuwait-areas";

type SiteHeaderProps = {
  selectedArea?: SelectedKuwaitArea | null;
  areaLabel?: string | null;
  servedAreas?: ServedArea[];
  promptAreaOnMount?: boolean;
};

/** Decorative gold mark sitting above the wordmark (sweets/pistachio motif). */
function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M24 3c7 6 11 12 11 19 0 8.5-5.4 14-11 23-5.6-9-11-14.5-11-23C13 15 17 9 24 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M24 9c4.2 4 6.6 8 6.6 13 0 5.4-3 9.4-6.6 15-3.6-5.6-6.6-9.6-6.6-15 0-5 2.4-9 6.6-13Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <path d="M24 3v42" stroke="currentColor" strokeWidth="1" opacity="0.45" />
    </svg>
  );
}

const NAV_LINKS = [
  { href: "/", key: "nav.home" as const, show: "" },
  { href: "/menu", key: "nav.menu" as const, show: "" },
  { href: "/gifts", key: "nav.gifts" as const, show: "" },
  { href: "/occasions", key: "nav.occasions" as const, show: "hidden md:inline-flex" },
  { href: "/promotions", key: "nav.promotions" as const, show: "" },
  { href: "/loyalty", key: "nav.loyalty" as const, show: "hidden sm:inline-flex" },
  { href: "/about", key: "nav.about" as const, show: "hidden md:inline-flex" },
  { href: "/contact", key: "nav.contact" as const, show: "hidden md:inline-flex" },
];

export function SiteHeader({
  selectedArea = null,
  areaLabel = null,
  servedAreas = [],
  promptAreaOnMount = false,
}: SiteHeaderProps) {
  const { t } = useI18n();
  const { user, ready } = useCustomerAuth();
  const pathname = usePathname();
  // On the homepage the header floats transparently over the hero (not sticky,
  // no solid bar). Elsewhere it stays a normal sticky bar.
  const overlay = pathname === "/";
  const count = useCartStore((s) =>
    s.lines.reduce((n, l) => n + l.quantity, 0)
  );
  const setOpen = useCartStore((s) => s.setOpen);

  return (
    <header
      className={cn(
        overlay
          ? "bg-gradient-to-b from-[#0c0803]/85 via-[#0c0803]/45 to-transparent"
          : "border-b border-border/60 bg-background/80 backdrop-blur-xl"
      )}
    >
      {/* Top row: search · logo · account/cart */}
      <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-1.5 px-2.5 py-2.5 sm:gap-3 sm:px-4 sm:py-4 md:px-6">
        {/* Left: menu (mobile) · search */}
        <div className="flex min-w-0 items-center justify-start gap-0.5 sm:gap-1">
          <MobileNav />
          <StorefrontAreaPicker
            selected={selectedArea}
            areaLabel={areaLabel}
            servedAreas={servedAreas}
            promptOnMount={promptAreaOnMount}
          />
          <Link
            href="/search"
            className="group inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg px-2 py-2 text-muted-foreground transition hover:text-foreground sm:min-w-0 sm:justify-start"
            aria-label={t("nav.search")}
          >
            <Search className="size-5 transition group-hover:text-primary" />
            <span className="hidden text-sm sm:inline">{t("nav.search")}</span>
          </Link>
        </div>

        {/* Center: logo */}
        <Link
          href="/"
          className="group flex flex-col items-center leading-none"
          aria-label="Al Aridi Sweets"
        >
          <BrandMark className="mb-1 size-6 text-primary transition group-hover:scale-105 sm:mb-1.5 sm:size-9" />
          <span className="font-heading text-xl tracking-[0.22em] text-gradient-gold sm:text-2xl sm:tracking-[0.28em] md:text-3xl">
            AL ARIDI
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.35em] text-muted-foreground sm:mt-1 sm:gap-2 sm:text-xs sm:tracking-[0.45em]">
            <span className="h-px w-3 bg-primary/40 sm:w-5" />
            Sweets
            <span className="h-px w-3 bg-primary/40 sm:w-5" />
          </span>
        </Link>

        {/* Right: account + cart */}
        <div className="flex min-w-0 items-center justify-end gap-0 sm:gap-2">
          <ThemeToggle className="shrink-0" />
          <div className="hidden lg:block">
            <LanguageToggle />
          </div>
          {ready && user ? (
            <Link
              href="/account"
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm text-muted-foreground transition hover:text-foreground sm:min-w-0"
              title={t("nav.account")}
            >
              <User className="size-5" />
              <span className="hidden md:inline">{t("nav.account")}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm text-muted-foreground transition hover:text-foreground sm:min-w-0"
              title={t("nav.account")}
            >
              <User className="size-5" />
              <span className="hidden md:inline">{t("nav.auth.login")}</span>
            </Link>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "relative min-h-11 min-w-11 shrink-0 border-primary/30 bg-secondary/40 px-2.5 hover:bg-secondary sm:min-w-0 sm:px-3",
              count > 0 && "gold-glow"
            )}
            onClick={() => setOpen(true)}
          >
            <ShoppingBag className="size-4" />
            <span className="ms-1.5 hidden sm:inline">
              {t("nav.cart")} ({count})
            </span>
            {count > 0 && (
              <span className="absolute -top-1.5 end-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground sm:hidden">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Bottom row: centered nav (desktop only — mobile uses the drawer) */}
      <div className={cn("hidden lg:block", overlay ? "" : "border-t border-border/40")}>
        <nav className="scrollbar-none mx-auto flex max-w-6xl snap-x snap-mandatory items-center justify-start gap-0.5 overflow-x-auto px-3 py-2 sm:justify-center sm:gap-1.5 sm:px-4 md:px-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "inline-flex min-h-11 shrink-0 snap-start items-center whitespace-nowrap rounded-lg px-3 py-2.5 text-sm tracking-wide text-muted-foreground transition hover:bg-muted hover:text-foreground",
                link.show
              )}
            >
              {t(link.key)}
            </Link>
          ))}
          <span className="mx-1 hidden h-4 w-px bg-border/60 lg:hidden" />
          <div className="ms-1 lg:hidden">
            <LanguageToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
