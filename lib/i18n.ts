export const LOCALES = ["en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_COOKIE = "alaridi-locale";

/** Persisted language preference (mirrors cookie) */
export const LOCALE_STORAGE_KEY = "alaridi-locale";

export function isRtl(locale: Locale): boolean {
  return locale === "ar";
}

