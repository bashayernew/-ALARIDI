import type { PaymentMethod } from "@prisma/client";

/**
 * Payment gateway adapter.
 *
 * The site is wired up to call `initiatePayment()` after an order is created
 * (status PENDING). When the Kuwait gateway (MyFatoorah, Tap, KNET, etc.) is
 * ready, replace the body of `initiatePayment` with the actual API call and
 * also wire up `verifyPaymentWebhook()` for the gateway callback. The order
 * model already has `paymentMethod` and `paymentRef` columns to record the
 * gateway reference.
 */

export type PaymentInitInput = {
  orderId: string;
  amountKwd: number;
  customerEmail?: string | null;
  customerName: string;
  method: PaymentMethod;
};

export type PaymentInitResult = {
  /** True if the gateway accepted the request. */
  success: boolean;
  /** Gateway reference / transaction id to persist on the Order. */
  gatewayReference?: string;
  /** Optional URL to redirect the customer to a hosted payment page. */
  redirectUrl?: string;
  /** Human-readable message. */
  message: string;
};

const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER ?? "none";

export async function initiatePayment(
  input: PaymentInitInput
): Promise<PaymentInitResult> {
  // Cash on delivery never goes through the gateway.
  if (input.method === "CASH_ON_DELIVERY") {
    return { success: true, message: "Cash on delivery" };
  }
  switch (PAYMENT_PROVIDER) {
    case "hesabe": {
      const { createHesabeCheckout } = await import("@/lib/hesabe");
      try {
        const redirectUrl = await createHesabeCheckout({
          orderId: input.orderId,
          amountKwd: input.amountKwd,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
        });
        return {
          success: true,
          redirectUrl,
          message: "Redirecting to Hesabe payment page",
        };
      } catch (e) {
        console.error("Hesabe checkout error:", e);
        // Order stays PENDING; customer sees confirmation with unpaid note.
        return {
          success: false,
          message:
            e instanceof Error ? e.message : "Payment gateway unavailable",
        };
      }
    }
    // --- Add your provider here ---
    // case "myfatoorah":
    //   return initiateMyFatoorah(input);
    // case "tap":
    //   return initiateTap(input);
    default:
      // No provider configured — return success so dev/preview flows continue.
      // In production the order will sit in PENDING until you wire this up.
      return {
        success: true,
        gatewayReference: undefined,
        redirectUrl: undefined,
        message:
          "Payment gateway not configured. Set PAYMENT_PROVIDER and the provider API keys to enable real charges.",
      };
  }
}

export type PaymentWebhookResult =
  | {
      ok: true;
      orderId: string;
      gatewayReference: string;
      paid: boolean;
    }
  | { ok: false; reason: string };

/**
 * Verify and parse a payment gateway webhook payload.
 * Stub — implement per provider when ready.
 */
export async function verifyPaymentWebhook(
  rawBody: string,
  signature: string | null
): Promise<PaymentWebhookResult> {
  void rawBody;
  void signature;
  return { ok: false, reason: "Payment provider not configured" };
}
