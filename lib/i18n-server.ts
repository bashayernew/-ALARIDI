import { cookies } from "next/headers";
import type { Locale } from "@/lib/i18n";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const cookieLocale = store.get("alaridi-locale")?.value;
  return cookieLocale === "ar" ? "ar" : "en";
}
