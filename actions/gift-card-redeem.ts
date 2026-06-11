"use server";

import { randomInt } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isPrismaConnectionError } from "@/lib/db-safe";
import {
  normalizeRecipientEmail,
  normalizeRecipientPhone,
  validateGiftCardForRedemption,
} from "@/lib/gift-cards";
import { creditCustomerWallet } from "@/lib/wallet";
import {
  getCurrentCustomer,
  getCurrentCustomerId,
} from "@/lib/customer-auth/server";
import { sendEmail } from "@/lib/email";
import { sendGiftCardOtpWhatsApp } from "@/lib/whatsapp";

const OTP_TTL_MS = 10 * 60 * 1000;

export type GiftCardRedeemError =
  | "not_found"
  | "disabled"
  | "expired"
  | "empty"
  | "pending"
  | "already_redeemed"
  | "wrong_recipient"
  | "not_active"
  | "invalid_channel"
  | "invalid_otp"
  | "otp_expired"
  | "login_required"
  | "service_unavailable";

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export async function sendGiftCardRedemptionOtp(input: {
  code: string;
  channel: "email" | "phone";
  target: string;
}): Promise<{ ok: true } | { ok: false; code: GiftCardRedeemError }> {
  const code = normalizeCode(input.code);
  const target =
    input.channel === "email"
      ? normalizeRecipientEmail(input.target)
      : normalizeRecipientPhone(input.target);

  if (!target) return { ok: false, code: "invalid_channel" };

  try {
    const card = await prisma.giftCard.findUnique({ where: { code } });
    const v = validateGiftCardForRedemption(
      card,
      input.channel === "email" ? target : null,
      input.channel === "phone" ? target : null
    );
    if (!v.ok) return { ok: false, code: v.code };

    const otp = String(randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await prisma.giftCardRedemptionOtp.deleteMany({
      where: { giftCardId: card!.id },
    });
    await prisma.giftCardRedemptionOtp.create({
      data: {
        giftCardId: card!.id,
        channel: input.channel,
        target,
        code: otp,
        expiresAt,
      },
    });

    if (input.channel === "email") {
      await sendEmail({
        to: target,
        subject: "Your Al Aridi gift card verification code",
        text: `Your verification code is ${otp}. It expires in 10 minutes.\n\nEnter this code on your account page to add the gift card balance to your store wallet.`,
      });
    } else {
      await sendGiftCardOtpWhatsApp({ to: target, otp });
    }

    return { ok: true };
  } catch (e) {
    if (isPrismaConnectionError(e)) {
      return { ok: false, code: "service_unavailable" };
    }
    throw e;
  }
}

export async function verifyAndRedeemGiftCard(input: {
  code: string;
  otp: string;
  channel: "email" | "phone";
  target: string;
}): Promise<
  | { ok: true; creditedKwd: number; walletBalanceKwd: number }
  | { ok: false; code: GiftCardRedeemError }
> {
  const customerId = await getCurrentCustomerId();
  if (!customerId) return { ok: false, code: "login_required" };

  const code = normalizeCode(input.code);
  const target =
    input.channel === "email"
      ? normalizeRecipientEmail(input.target)
      : normalizeRecipientPhone(input.target);
  const otp = input.otp.trim();

  if (!target || !otp) return { ok: false, code: "invalid_otp" };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const card = await tx.giftCard.findUnique({ where: { code } });
      const v = validateGiftCardForRedemption(
        card,
        input.channel === "email" ? target : null,
        input.channel === "phone" ? target : null
      );
      if (!v.ok) return { ok: false as const, code: v.code };

      const otpRow = await tx.giftCardRedemptionOtp.findFirst({
        where: {
          giftCardId: card!.id,
          channel: input.channel,
          target,
          code: otp,
        },
        orderBy: { createdAt: "desc" },
      });
      if (!otpRow) return { ok: false as const, code: "invalid_otp" as const };
      if (otpRow.expiresAt < new Date()) {
        return { ok: false as const, code: "otp_expired" as const };
      }

      const amount = Number(card!.balance);
      const walletBalance = await creditCustomerWallet(tx, {
        customerId,
        amount,
        type: "GIFT_CARD_REDEEM",
        giftCardId: card!.id,
        reason: `Redeemed gift card ${code}`,
      });

      await tx.giftCard.update({
        where: { id: card!.id },
        data: {
          balance: 0,
          status: "REDEEMED",
          redeemedById: customerId,
          redeemedAt: new Date(),
          txns: {
            create: {
              type: "REDEEM_TO_WALLET",
              amount,
              customerId,
              reason: "Transferred to store wallet",
            },
          },
        },
      });

      await tx.giftCardRedemptionOtp.deleteMany({
        where: { giftCardId: card!.id },
      });

      return { ok: true as const, creditedKwd: amount, walletBalanceKwd: walletBalance };
    });

    if (result.ok) {
      revalidatePath("/account");
      revalidatePath("/checkout");
      revalidatePath("/admin/gift-cards");
    }
    return result;
  } catch (e) {
    if (isPrismaConnectionError(e)) {
      return { ok: false, code: "service_unavailable" };
    }
    throw e;
  }
}

export async function getMyStoreCredit(): Promise<number> {
  const customer = await getCurrentCustomer();
  return customer?.storeCreditKwd ?? 0;
}
