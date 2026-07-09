"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu,
  X,
  Home,
  Search,
  UtensilsCrossed,
  Gift,
  Sparkles,
  Percent,
  Award,
  Info,
  Phone,
  User,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/i18n-provider";
import { useCustomerAuth } from "@/components/auth/customer-auth-provider";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { TranslationKey } from "@/lib/dictionary";

const LINKS: { href: string; key: TranslationKey; icon: LucideIcon }[] = [
  { href: "/", key: "nav.home", icon: Home },
  { href: "/search", key: "nav.search", icon: Search },
  { href: "/menu", key: "nav.menu", icon: UtensilsCrossed },
  { href: "/gifts", key: "nav.gifts", icon: Gift },
  { href: "/occasions", key: "nav.occasions", icon: Sparkles },
  { href: "/promotions", key: "nav.promotions", icon: Percent },
  { href: "/loyalty", key: "nav.loyalty", icon: Award },
  { href: "/about", key: "nav.about", icon: Info },
  { href: "/contact", key: "nav.contact", icon: Phone },
];

export function MobileNav() {
  const { t, dir } = useI18n();
  const { user, ready } = useCustomerAuth();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  // Lock body scroll while the drawer is open; close on Escape.
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const fromStart = dir === "rtl" ? "100%" : "-100%";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("nav.menu")}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-foreground transition hover:text-primary lg:hidden"
      >
        <Menu className="size-6" />
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
          <motion.div
            className="fixed inset-0 z-[100] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: fromStart }}
              animate={{ x: 0 }}
              exit={{ x: fromStart }}
              transition={{ type: "tween", duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 start-0 flex w-[82%] max-w-[340px] flex-col overflow-y-auto border-e border-primary/20 bg-gradient-to-b from-[#16110c] via-[#120d09] to-[#0c0805] shadow-2xl"
            >
              {/* Header: brand + close */}
              <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
                <span className="leading-none">
                  <span className="block font-heading text-xl tracking-[0.2em] text-gradient-gold">
                    AL ARIDI
                  </span>
                  <span className="mt-1 block text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
                    Sweets
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="inline-flex size-10 items-center justify-center rounded-full border border-border/50 text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Profile */}
              <Link
                href={ready && user ? "/account" : "/login"}
                onClick={() => setOpen(false)}
                className="mx-4 mt-4 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/[0.06] p-4 transition hover:border-primary/40"
              >
                <span className="inline-flex size-11 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <User className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {ready && user ? user.fullName || t("nav.account") : t("nav.auth.login")}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {ready && user ? t("nav.account") : t("nav.auth.login")}
                  </span>
                </span>
                <ArrowRight
                  className={cn(
                    "ms-auto size-4 text-primary",
                    dir === "rtl" && "rotate-180"
                  )}
                />
              </Link>

              {/* Links */}
              <nav className="mt-4 flex flex-col gap-1 px-3">
                {LINKS.map(({ href, key, icon: Icon }) => {
                  const active = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border-s-2 px-3 py-3 text-sm font-medium transition-all duration-200",
                        active
                          ? "border-primary bg-primary/12 text-primary"
                          : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:ps-4"
                      )}
                    >
                      <Icon className="size-5 shrink-0" />
                      {t(key)}
                      {active && (
                        <ArrowRight
                          className={cn(
                            "ms-auto size-4",
                            dir === "rtl" && "rotate-180"
                          )}
                        />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Footer: language + theme */}
              <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/40 px-5 py-4">
                <LanguageToggle />
                <ThemeToggle />
              </div>
            </motion.aside>
          </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
