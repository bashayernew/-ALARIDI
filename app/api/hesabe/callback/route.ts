import { NextRequest, NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseHesabeCallback, siteUrl } from "@/lib/hesabe";
import { awardLoyaltyForPaidOrder } from "@/lib/loyalty-points";
import {
  activateGiftCardsForOrder,
  sendActivatedGiftCardEmails,
} from "@/lib/gift-card-activate";

export const dynamic = "force-dynamic";

/**
 * Hesabe redirects the customer here after payment (both success and
 * failure) with an encrypted ?data= payload. We verify it server-side,
 * mark the order PAID on success (triggering loyalty points and gift-card
 * activation), then send the customer to the confirmation page.
 */
async function handle(encryptedData: string | null): Promise<NextResponse> {
  const home = siteUrl();

  if (!encryptedData) {
    return NextResponse.redirect(`${home}/checkout/confirmation?payment=failed`);
  }

  let result;
  try {
    result = parseHesabeCallback(encryptedData);
  } catch (e) {
    console.error("Hesabe callback: cannot decrypt payload", e);
    return NextResponse.redirect(`${home}/checkout/confirmation?payment=failed`);
  }

  const orderId = result.orderId;
  if (!orderId) {
    return NextResponse.redirect(`${home}/checkout/confirmation?payment=failed`);
  }

  const qs = new URLSearchParams({ orderId });

  if (!result.success) {
    qs.set("payment", "failed");
    return NextResponse.redirect(
      `${home}/checkout/confirmation?${qs.toString()}`
    );
  }

  try {
    const emails = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new Error(`Order ${orderId} not found`);

      // Idempotent: Hesabe may call back more than once.
      if (order.status === OrderStatus.PAID) return [];

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PAID,
          paymentRef: result.paymentId ?? result.paymentToken ?? null,
        },
      });
      await awardLoyaltyForPaidOrder(tx, orderId);
      return activateGiftCardsForOrder(tx, orderId);
    });
    await sendActivatedGiftCardEmails(emails);
  } catch (e) {
    console.error("Hesabe callback: failed to mark order paid", e);
    // Payment went through at the gateway; leave the order for admin review.
  }

  qs.set("payment", "success");
  return NextResponse.redirect(`${home}/checkout/confirmation?${qs.toString()}`);
}

export async function GET(req: NextRequest) {
  return handle(req.nextUrl.searchParams.get("data"));
}

export async function POST(req: NextRequest) {
  // Hesabe may POST the result (form-encoded) instead of GET.
  let data: string | null = null;
  try {
    const form = await req.formData();
    const v = form.get("data");
    data = typeof v === "string" ? v : null;
  } catch {
    data = null;
  }
  if (!data) data = req.nextUrl.searchParams.get("data");
  return handle(data);
}
