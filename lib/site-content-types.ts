export type SiteContentOverrideMap = Record<
  string,
  { valueEn: string; valueAr: string }
>;

export type SocialUrlKey =
  | "instagram"
  | "tiktok"
  | "snapchat"
  | "whatsapp";

export const DEFAULT_SOCIAL_URLS: Record<SocialUrlKey, string> = {
  instagram: "https://www.instagram.com/alaridisweets",
  tiktok: "https://www.tiktok.com/@alaridisweets",
  snapchat: "https://www.snapchat.com/@alaridi_sweets",
  whatsapp: "https://wa.me/96590090892",
};

export function mergeSocialUrlsFromContent(
  map: SiteContentOverrideMap
): Record<SocialUrlKey, string> {
  const out = { ...DEFAULT_SOCIAL_URLS };
  (Object.keys(DEFAULT_SOCIAL_URLS) as SocialUrlKey[]).forEach((k) => {
    const row = map[`social.url.${k}`];
    const url = (row?.valueEn || row?.valueAr || "").trim();
    if (url) out[k] = url;
  });
  return out;
}

export type FeatureFlagKey = "giftCards" | "giftBaskets" | "promotions";

export const DEFAULT_FEATURE_FLAGS: Record<FeatureFlagKey, boolean> = {
  giftCards: true,
  giftBaskets: true,
  promotions: true,
};

/** Flags are stored in SiteContent as `feature.<key>` = "on" | "off". */
export function mergeFeatureFlagsFromContent(
  map: SiteContentOverrideMap
): Record<FeatureFlagKey, boolean> {
  const out = { ...DEFAULT_FEATURE_FLAGS };
  (Object.keys(DEFAULT_FEATURE_FLAGS) as FeatureFlagKey[]).forEach((k) => {
    const v = (map[`feature.${k}`]?.valueEn ?? "").trim().toLowerCase();
    if (v === "off") out[k] = false;
  });
  return out;
}
