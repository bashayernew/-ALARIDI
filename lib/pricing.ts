/** Optional add-on fees (KWD), applied per line item */
export const GIFT_WRAP_FEE_KWD = 1;
/** Minimum items value (KWD) required to create a custom gift basket. */
export const MIN_GIFT_BASKET_KWD = 15;
export const EXTRA_TOPPINGS_FEE_KWD = 0.5;

export function lineExtrasTotalKwd(
  quantity: number,
  giftWrap: boolean,
  extraToppings: boolean
): number {
  let perUnit = 0;
  if (giftWrap) perUnit += GIFT_WRAP_FEE_KWD;
  if (extraToppings) perUnit += EXTRA_TOPPINGS_FEE_KWD;
  return perUnit * quantity;
}
