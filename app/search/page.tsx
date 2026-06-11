import type { Metadata } from "next";
import {
  getMenuFullPagePayload,
  localizeMenuForStorefront,
} from "@/lib/menu-public-data";
import { getLocale } from "@/lib/i18n-server";
import { SearchPageInner } from "@/components/search/search-page-inner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search",
  description: "Search Al Aridi Sweets — kunafa, baklava, gift trays and more.",
};

export default async function SearchPage() {
  const locale = await getLocale();
  const menuPayload = await getMenuFullPagePayload();
  const sections = await localizeMenuForStorefront(menuPayload, locale);
  return <SearchPageInner sections={sections} />;
}
