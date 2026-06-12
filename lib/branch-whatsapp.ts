import { prisma } from "@/lib/prisma";
import { dbQuery } from "@/lib/db-safe";

/** Extract a digits-only phone number from a raw number or a wa.me URL. */
export function whatsappDigits(s: string): string {
  const m = (s ?? "").match(/(\d{6,})/);
  return m?.[1] ?? "";
}

/**
 * WhatsApp link for the storefront. Uses the resolved branch's number when set,
 * otherwise the provided global fallback (a full wa.me URL from site settings).
 */
export async function resolveStorefrontWhatsappUrl(
  branchId: string | null,
  fallbackUrl: string
): Promise<string> {
  if (!branchId) return fallbackUrl;
  const branch = await dbQuery(null, () =>
    prisma.branch.findUnique({
      where: { id: branchId },
      select: { whatsappNumber: true },
    })
  );
  const num = whatsappDigits(branch?.whatsappNumber ?? "");
  return num ? `https://wa.me/${num}` : fallbackUrl;
}
