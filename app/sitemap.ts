import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.alaridisweets.com";
  const routes = [
    "",
    "/menu",
    "/gifts",
    "/checkout",
    "/cart",
    "/loyalty",
    "/account",
    "/privacy-policy",
    "/refund-policy",
    "/terms-and-conditions",
  ];

  return routes.map((route) => ({
    url: `${base}${route}`,
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.8,
  }));
}
