"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { LOCALE_COOKIE, LOCALE_STORAGE_KEY, isRtl } from "@/lib/i18n";
import {
  translate,
  type TranslationKey,
} from "@/lib/dictionary";
import type { SiteContentOverrideMap } from "@/lib/site-content-types";

export type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (
    key: TranslationKey,
    vars?: Record<string, string | number>
  ) => string;
  dir: "rtl" | "ltr";
};

const I18nContext = React.createContext<I18nContextValue | null>(null);

export function useI18n(): I18nContextValue {
  const ctx = React.useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}

export function I18nProvider({
  children,
  initialLocale,
  siteContentOverrides,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
  /** DB-backed copy overrides; non-empty values replace dictionary strings. */
  siteContentOverrides?: SiteContentOverrideMap;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = React.useState<Locale>(initialLocale);
  const syncedRef = React.useRef(false);

  React.useEffect(() => {
    setLocaleState(initialLocale);
  }, [initialLocale]);

  React.useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = isRtl(locale) ? "rtl" : "ltr";
  }, [locale]);

  /** Prefer localStorage on first paint so refresh keeps language */
  React.useEffect(() => {
    if (syncedRef.current) return;
    syncedRef.current = true;
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
      if ((stored === "ar" || stored === "en") && stored !== initialLocale) {
        document.cookie = `${LOCALE_COOKIE}=${stored}; path=/; max-age=31536000; samesite=lax`;
        router.refresh();
      }
    } catch {
      /* ignore */
    }
  }, [initialLocale, router]);

  const setLocale = React.useCallback(
    (next: Locale) => {
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      setLocaleState(next);
      router.refresh();
    },
    [router]
  );

  const t = React.useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      const row = siteContentOverrides?.[key];
      if (row) {
        const raw = (locale === "ar" ? row.valueAr : row.valueEn).trim();
        if (raw) {
          let s = raw;
          if (vars) {
            for (const [vk, vv] of Object.entries(vars)) {
              s = s.replaceAll(`{${vk}}`, String(vv));
            }
          }
          return s;
        }
      }
      return translate(locale, key, vars);
    },
    [locale, siteContentOverrides]
  );

  const value = React.useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t,
      dir: isRtl(locale) ? "rtl" : "ltr",
    }),
    [locale, setLocale, t]
  );

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}
