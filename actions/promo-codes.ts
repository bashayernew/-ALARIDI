"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentCustomerId } from "@/lib/customer-auth/server";
import { validatePromoForCart, type PromoCartLine } from "@/lib/promotions";
import { isPrismaConnectionError } from "@/lib/db-safe";

export type ValidatePromoLineInput = {
  productId: string;
  lineTotal: number;
};

export type ValidatePromoResult =
  | {
      ok: true;
      code: string;
      type: "PERCENT" | "FIXED" | "FREE_SHIPPING" | "BUY_X_GET_Y";
      subtotalDiscount: number;
      deliveryDiscount: number;
    }
  | {
      ok: false;
      code:
        | "not_found"
        | "disabled"
        | "expired"
        | "not_started"
        | "min_order"
        | "max_uses"
        | "max_uses_customer"
        | "wrong_customer"
        | "no_eligible_items"
        | "service_unavailable";
    };

export async function validatePromoCode(input: {
  code: string;
  subtotal: number;
  deliveryFee: number;
  lines?: ValidatePromoLineInput[];
}): Promise<ValidatePromoResult> {
  const codeKey = input.code.trim().toUpperCase();
  if (!codeKey) return { ok: false, code: "not_found" };

  try {
    const promo = await prisma.promoCode.findUnique({
      where: { code: codeKey },
      include: { products: true, categories: true },
    });
    const customerId = await getCurrentCustomerId();

    const productIds = (input.lines ?? []).map((l) => l.productId);
    const products =
      productIds.length > 0
        ? await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, category: true },
          })
        : [];
    const categoryByProduct = new Map(
      products.map((p) => [p.id, p.category as string])
    );

    const cartLines: PromoCartLine[] =
      input.lines && input.lines.length > 0
        ? input.lines.map((l) => ({
            productId: l.productId,
            category: categoryByProduct.get(l.productId) ?? "MUST_TRY",
            lineTotal: l.lineTotal,
          }))
        : [
            {
              productId: "_fallback",
              category: "MUST_TRY",
              lineTotal: input.subtotal,
            },
          ];

    const customerUseCount =
      customerId && promo
        ? await prisma.order.count({
            where: {
              customerUserId: customerId,
              promoCodeId: promo.id,
              status: { not: "CANCELLED" },
            },
          })
        : 0;

    const validation = validatePromoForCart(
      promo,
      cartLines,
      input.deliveryFee,
      customerId,
      customerUseCount
    );
    if (!validation.ok) return { ok: false, code: validation.code };
    return {
      ok: true,
      code: validation.promo.code,
      type: validation.promo.discountType,
      subtotalDiscount: validation.subtotalDiscount,
      deliveryDiscount: validation.deliveryDiscount,
    };
  } catch (e) {
    if (isPrismaConnectionError(e)) {
      return { ok: false, code: "service_unavailable" };
    }
    throw e;
  }
}

export async function countCustomerPromoUses(
  customerId: string | null | undefined,
  promoCodeId: string
): Promise<number> {
  if (!customerId) return 0;
  return prisma.order.count({
    where: {
      customerUserId: customerId,
      promoCodeId,
      status: { not: "CANCELLED" },
    },
  });
}
