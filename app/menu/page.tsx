import { MenuFullPage } from "@/components/menu/menu-full-page";
import {
  getMenuFullPagePayload,
  localizeMenuForStorefront,
} from "@/lib/menu-public-data";
import { getLocale } from "@/lib/i18n-server";

export const metadata = {
  title: "Full Menu",
  description:
    "Lebanese sweets, gift trays, diet sweets, and artisan moone — Al Aridi Sweets Kuwait.",
};

export default async function MenuPage() {
  const locale = await getLocale();
  const menuPayload = await getMenuFullPagePayload();
  const sections = await localizeMenuForStorefront(menuPayload, locale);
  return <MenuFullPage initialSections={sections} />;
}
