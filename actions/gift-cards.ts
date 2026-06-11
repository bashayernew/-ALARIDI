"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomerId } from "@/lib/customer-auth/server";
import { generateGiftCardCode, validateGiftCardRow } from "@/lib/gift-cards";
import { isPrismaConnectionError } from "@/lib/db-safe";
import { sendGiftCardEmail } from "@/lib/email";

export type ValidateGiftCardResult =
  | { ok: true; code: string; balance: number }
  | {
      ok: false;
      code:
        | "not_found"
        | "disabled"
        | "expired"
        | "empty"
        | "pending"
        | "already_redeemed"
        | "service_unavailable";
    };

/** Legacy checkout validation — gift cards are redeemed to wallet, not at checkout. */
export async function validateGiftCard(
  code: string
): Promise<ValidateGiftCardResult> {
  const k = code.trim().toUpperCase();
  if (!k) return { ok: false, code: "not_found" };
  try {
    const card = await prisma.giftCard.findUnique({ where: { code: k } });
    const v = validateGiftCardRow(card);
    if (!v.ok) return { ok: false, code: v.code };
    return { ok: true, code: v.giftCard.code, balance: v.balance };
  } catch (e) {
    if (isPrismaConnectionError(e)) {
      return { ok: false, code: "service_unavailable" };
    }
    throw e;
  }
}

export type IssueGiftCardInput = {
  amount: number;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientName?: string;
  message?: string;
};

export type IssueGiftCardResult =
  | { ok: true; code: string; balance: number }
  | { ok: false; error: string };

const MAX_CUSTOM_AMOUNT = 500;
const MIN_CUSTOM_AMOUNT = 1;

/** Admin/manual issue — immediately active with a real code. */
export async function issueGiftCard(
  input: IssueGiftCardInput
): Promise<IssueGiftCardResult> {
  const amount = Number(input.amount);
  if (
    !Number.isFinite(amount) ||
    amount < MIN_CUSTOM_AMOUNT ||
    amount > MAX_CUSTOM_AMOUNT
  ) {
    return { ok: false, error: "Invalid amount" };
  }

  const email = input.recipientEmail?.trim().toLowerCase() || null;
  const phone = input.recipientPhone?.replace(/\D/g, "") || null;
  if (!email && !phone) {
    return { ok: false, error: "Recipient email or phone is required" };
  }

  try {
    const code = generateGiftCardCode();
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    const now = new Date();

    const card = await prisma.giftCard.create({
      data: {
        code,
        initialValue: amount,
        balance: amount,
        status: "ACTIVE",
        activatedAt: now,
        recipientName: input.recipientName?.trim() || null,
        recipientEmail: email,
        recipientPhone: phone,
        ownerEmail: email,
        message: input.message?.trim() || "",
        expiresAt,
        txns: {
          create: [
            { type: "ISSUE", amount },
            { type: "ACTIVATE", amount, reason: "Admin issued" },
          ],
        },
      },
    });

    if (email) {
      sendGiftCardEmail({
        to: email,
        code: card.code,
        amountKwd: amount,
        recipientName: input.recipientName ?? "",
        message: input.message ?? "",
      }).catch(() => {});
    }

    revalidatePath("/account");
    revalidatePath("/admin/gift-cards");
    return { ok: true, code: card.code, balance: amount };
  } catch (e) {
    if (isPrismaConnectionError(e)) {
      return { ok: false, error: "Service temporarily unavailable" };
    }
    throw e;
  }
}