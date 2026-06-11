import { EXTRA_TOPPINGS_FEE_KWD, GIFT_WRAP_FEE_KWD } from "@/lib/pricing";
import type { CartLine } from "@/store/cart-store";
import { isGiftCardLine, isGiftBasketLine } from "@/store/cart-store";

export function lineUnitExtras(l: CartLine): number {
  if (isGiftCardLine(l) || isGiftBasketLine(l)) return 0;
  let u = 0;
  if (l.giftWrap) u += GIFT_WRAP_FEE_KWD;
  if (l.extraToppings) u += EXTRA_TOPPINGS_FEE_KWD;
  return u;
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce(
    (sum, l) => sum + l.price * l.quantity + lineUnitExtras(l) * l.quantity,
    0
  );
}
