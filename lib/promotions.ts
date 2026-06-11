import type { PromoCode } from "@prisma/client";

export type PromoCartLine = {
  productId: string;
  category: string;
  lineTotal: number;
};

export type PromoWithScope = PromoCode & {
  products: { productId: string }[];
  categories: { category: string }[];
};

export type PromoValidation =
  | {
      ok: true;
      promo: PromoCode;
      subtotalDiscount: number;
      deliveryDiscount: number;
      eligibleSubtotal: number;
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
        | "no_eligible_items";
    };

export function activePublicPromoWhere(now: Date = new Date()) {
  return {
    enabled: true,
    isPublic: true,
    customerId: null as string | null,
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
    ],
  };
}

export function isPromoScheduleActive(
  promo: Pick<PromoCode, "enabled" | "startsAt" | "endsAt" | "maxUses" | "usedCount">,
  now: Date = new Date()
): boolean {
  if (!promo.enabled) return false;
  if (promo.startsAt && promo.startsAt > now) return false;
  if (promo.endsAt && promo.endsAt < now) return false;
  if (promo.maxUses != null && promo.usedCount >= promo.maxUses) return false;
  return true;
}

export function computeEligibleSubtotal(
  promo: PromoWithScope,
  lines: PromoCartLine[]
): number {
  const productIds = new Set(promo.products.map((p) => p.productId));
  const categories = new Set(promo.categories.map((c) => c.category));

  if (productIds.size === 0 && categories.size === 0) {
    return round3(lines.reduce((sum, line) => sum + line.lineTotal, 0));
  }

  return round3(
    lines.reduce((sum, line) => {
      const byProduct = productIds.size > 0 && productIds.has(line.productId);
      const byCategory = categories.size > 0 && categories.has(line.category);
      if (productIds.size > 0 && categories.size > 0) {
        return byProduct || byCategory ? sum + line.lineTotal : sum;
      }
      if (byProduct || byCategory) return sum + line.lineTotal;
      return sum;
    }, 0)
  );
}

export function validatePromoForCart(
  promo: PromoWithScope | null,
  lines: PromoCartLine[],
  deliveryFee: number,
  customerId: string | null,
  customerUseCount: number,
  now: Date = new Date()
): PromoValidation {
  if (!promo) return { ok: false, code: "not_found" };
  if (!promo.enabled) return { ok: false, code: "disabled" };
  if (promo.startsAt && promo.startsAt > now) {
    return { ok: false, code: "not_started" };
  }
  if (promo.endsAt && promo.endsAt < now) {
    return { ok: false, code: "expired" };
  }
  if (promo.maxUses != null && promo.usedCount >= promo.maxUses) {
    return { ok: false, code: "max_uses" };
  }
  if (
    promo.maxUsesPerCustomer != null &&
    customerUseCount >= promo.maxUsesPerCustomer
  ) {
    return { ok: false, code: "max_uses_customer" };
  }
  if (promo.customerId && promo.customerId !== customerId) {
    return { ok: false, code: "wrong_customer" };
  }

  const cartSubtotal = round3(
    lines.reduce((sum, line) => sum + line.lineTotal, 0)
  );
  const eligibleSubtotal = computeEligibleSubtotal(promo, lines);

  if (eligibleSubtotal <= 0 && (promo.products.length > 0 || promo.categories.length > 0)) {
    return { ok: false, code: "no_eligible_items" };
  }

  if (promo.minOrderAmount && cartSubtotal < Number(promo.minOrderAmount)) {
    return { ok: false, code: "min_order" };
  }

  let subtotalDiscount = 0;
  let deliveryDiscount = 0;
  const discountBase = eligibleSubtotal > 0 ? eligibleSubtotal : cartSubtotal;

  switch (promo.discountType) {
    case "PERCENT": {
      const pct = Number(promo.discountValue);
      subtotalDiscount = Math.min(discountBase, (discountBase * pct) / 100);
      break;
    }
    case "FIXED": {
      subtotalDiscount = Math.min(discountBase, Number(promo.discountValue));
      break;
    }
    case "FREE_SHIPPING": {
      deliveryDiscount = deliveryFee;
      break;
    }
    case "BUY_X_GET_Y": {
      subtotalDiscount = Math.min(discountBase, Number(promo.discountValue));
      break;
    }
  }

  return {
    ok: true,
    promo,
    subtotalDiscount: round3(subtotalDiscount),
    deliveryDiscount: round3(deliveryDiscount),
    eligibleSubtotal,
  };
}

/** @deprecated Use validatePromoForCart */
export function validatePromoForSubtotal(
  promo: PromoCode | null,
  subtotal: number,
  deliveryFee: number,
  customerId: string | null,
  now: Date = new Date()
): PromoValidation {
  return validatePromoForCart(
    promo
      ? {
          ...promo,
          products: [],
          categories: [],
        }
      : null,
    [{ productId: "_all", category: "MUST_TRY", lineTotal: subtotal }],
    deliveryFee,
    customerId,
    0,
    now
  );
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export function filterActivePublicPromos<T extends PromoCode>(rows: T[]): T[] {
  const now = new Date();
  return rows.filter((p) => isPromoScheduleActive(p, now));
}
