"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n/i18n-provider";

export function SiteFooter() {
  const { t } = useI18n();

  return (
    <footer className="mt-24 border-t border-border/60 bg-card/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="space-y-3">
          <p className="font-heading text-xl text-gradient-gold">Al Aridi Sweets</p>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            {t("footer.tagline")}
          </p>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            {t("footer.explore")}
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link className="hover:text-foreground" href="/menu">
                {t("footer.fullMenu")}
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" href="/gifts">
                {t("nav.gifts")}
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" href="/promotions">
                {t("nav.promotions")}
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" href="/loyalty">
                {t("footer.loyaltyRewards")}
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" href="/about">
                {t("nav.about")}
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" href="/contact">
                {t("nav.contact")}
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" href="/account">
                {t("nav.account")}
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" href="/login">
                {t("nav.auth.login")}
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" href="/register">
                {t("nav.auth.register")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            {t("footer.contact")}
          </p>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>
              <span className="text-foreground/90">Salmiya</span>
              <br />
              <a
                href="tel:+96590090892"
                className="hover:text-primary"
              >
                +965 9009 0892
              </a>
            </li>
            <li>
              <span className="text-foreground/90">Jahra</span>
              <br />
              <a
                href="tel:+96590090132"
                className="hover:text-primary"
              >
                +965 9009 0132
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            {t("footer.locations")}
          </p>
          <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>Assima Mall, Salmiya Qatar Street</li>
            <li>Jahra Sahari Mall</li>
          </ul>
          <div className="mt-4 space-y-1 text-xs text-muted-foreground">
            <Link href="/privacy-policy" className="block hover:text-foreground">
              {t("footer.privacy")}
            </Link>
            <Link href="/refund-policy" className="block hover:text-foreground">
              {t("footer.refund")}
            </Link>
            <Link href="/terms-and-conditions" className="block hover:text-foreground">
              {t("footer.terms")}
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Al Aridi Sweets. {t("footer.rights")}
      </div>
    </footer>
  );
}
