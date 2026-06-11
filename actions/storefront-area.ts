"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  findArea,
  formatAreaCookieValue,
  STOREFRONT_AREA_COOKIE,
} from "@/lib/kuwait-areas";

export async function setStorefrontArea(
  governorateKey: string,
  areaKey: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!findArea(governorateKey, areaKey)) {
    return { ok: false, error: "Invalid area" };
  }
  const jar = await cookies();
  jar.set(
    STOREFRONT_AREA_COOKIE,
    formatAreaCookieValue({ governorateKey, areaKey }),
    {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    }
  );
  revalidatePath("/", "layout");
  return { ok: true };
}
