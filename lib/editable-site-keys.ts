import type { TranslationKey } from "@/lib/dictionary";

/** Dictionary keys admins can override via Site Content (non-empty = replace default copy). */
export const EDITABLE_SITE_KEYS = [
  "hero.kicker",
  "hero.title.before",
  "hero.title.highlight",
  "hero.subtitle",
  "hero.cta.order",
  "hero.cta.browse",
  "hero.freeDelivery",
  "checkout.page.note",
  "checkout.eta",
  "footer.tagline",
  "footer.rights",
  "home.loyaltyBlock.kicker",
  "home.loyaltyBlock.title",
  "home.loyaltyBlock.body",
  "home.loyaltyBlock.cta",
  "gifts.kicker",
  "gifts.title",
  "gifts.subtitle",
  "gifts.premade.desc",
  "gifts.cta",
] as const satisfies readonly TranslationKey[];

export type EditableSiteKey = (typeof EDITABLE_SITE_KEYS)[number];
