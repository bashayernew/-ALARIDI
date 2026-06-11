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
