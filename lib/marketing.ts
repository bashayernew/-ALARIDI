export const analyticsPlaceholders = {
  googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID ?? "",
  metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "",
};

export const abandonedCartEmailTemplate = {
  subject: "You left sweets in your cart",
  previewText: "Complete your Al Aridi order with one click.",
};

export const pushNotificationTemplate = {
  title: "Fresh sweets are ready",
  body: "Check new arrivals and limited offers.",
};
