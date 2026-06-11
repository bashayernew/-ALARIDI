import { PaymentMethod } from "@prisma/client";

/**
 * Online payment-gateway methods. Orders paid with these are marked PAID
 * automatically by the payment gateway once it confirms payment — never
 * manually by an admin. Cash-on-delivery is the only method an admin marks as
 * paid by hand (when they physically collect the cash).
 */
export const GATEWAY_PAYMENT_METHODS: PaymentMethod[] = [
  PaymentMethod.KNET,
  PaymentMethod.CARD,
  PaymentMethod.APPLE_PAY,
  PaymentMethod.GOOGLE_PAY,
];

/** True when the order is paid through the online gateway (not cash). */
export function isGatewayPaymentMethod(
  method: PaymentMethod | null | undefined
): boolean {
  return method != null && GATEWAY_PAYMENT_METHODS.includes(method);
}
