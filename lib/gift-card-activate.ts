import { Prisma, type PrismaClient } from "@prisma/client";
import {
  generateGiftCardCode,
  generatePendingGiftCardCode,
  isPendingGiftCardCode,
} from "@/lib/gift-cards";
import { sendGiftCardEmail } from "@/lib/email";
import { sendGiftCardWhatsApp } from "@/lib/whatsapp";

type TxClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

async function uniqueGiftCardCode(tx: TxClient): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const code = generateGiftCardCode();
    const exists = await tx.giftCard.findUnique({ where: { code } });
    if (!exists) return code;
  }
  throw new Error("Could not generate unique gift card code");
}

export type ActivatedGiftCardEmail = {
  code: string;
  amount: number;
  /** Recipient email (required at purchase). */
  to: string;
  /** Recipient WhatsApp number, if provided (optional). */
  phone?: string;
  recipientName: string;
  message: string;
};

/**
 * After an order is paid, activate pending gift cards: assign real codes,
 * set status ACTIVE, and return rows that should receive email.
 */
export async function activateGiftCardsForOrder(
  tx: TxClient,
  orderId: string
): Promise<ActivatedGiftCardEmail[]> {
  const pending = await tx.giftCard.findMany({
    where: { sourceOrderId: orderId, status: "PENDING" },
    include: { orderLine: true },
  });

  const emails: ActivatedGiftCardEmail[] = [];
  const now = new Date();

  for (const card of pending) {
    const code = isPendingGiftCardCode(card.code)
      ? await uniqueGiftCardCode(tx)
      : card.code;

    await tx.giftCard.update({
      where: { id: card.id },
      data: {
        code,
        status: "ACTIVE",
        activatedAt: now,
        txns: {
          create: {
            type: "ACTIVATE",
            amount: card.initialValue,
            orderId,
            customerId: card.purchasedByCustomerId,
            reason: "Activated after payment",
          },
        },
      },
    });

    const to =
      card.recipientEmail?.trim() ||
      card.orderLine?.recipientEmail?.trim() ||
      "";
    const phone =
      card.recipientPhone?.trim() ||
      card.orderLine?.receiverPhone?.trim() ||
      "";
    if (to || phone) {
      emails.push({
        code,
        amount: Number(card.initialValue),
        to,
        phone: phone || undefined,
        recipientName:
          card.recipientName?.trim() ||
          card.orderLine?.recipientName?.trim() ||
          "",
        message: card.message || card.orderLine?.cardMessage || "",
      });
    }
  }

  return emails;
}

export async function expireGiftCardAdmin(
  tx: TxClient,
  giftCardId: string,
  reason = "Expired by admin"
): Promise<void> {
  const card = await tx.giftCard.findUnique({ where: { id: giftCardId } });
  if (!card) throw new Error("Gift card not found");
  if (card.status === "REDEEMED") throw new Error("Gift card already redeemed");

  await tx.giftCard.update({
    where: { id: giftCardId },
    data: {
      status: "EXPIRED",
      enabled: false,
      balance: new Prisma.Decimal(0),
      txns: {
        create: {
          type: "EXPIRE",
          amount: card.balance,
          reason,
        },
      },
    },
  });
}

export async function disableGiftCardAdmin(
  tx: TxClient,
  giftCardId: string,
  reason = "Disabled by admin"
): Promise<void> {
  const card = await tx.giftCard.findUnique({ where: { id: giftCardId } });
  if (!card) throw new Error("Gift card not found");

  await tx.giftCard.update({
    where: { id: giftCardId },
    data: {
      status: "DISABLED",
      enabled: false,
      txns: {
        create: {
          type: "DISABLE",
          amount: card.balance,
          reason,
        },
      },
    },
  });
}

export function pendingGiftCardCreateData(input: {
  amount: number;
  recipientName?: string | null;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  message?: string | null;
  deliveryDate?: Date | null;
  giftCardProductId?: string | null;
  sourceOrderId: string;
  purchasedByCustomerId?: string | null;
}) {
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  return {
    code: generatePendingGiftCardCode(),
    initialValue: new Prisma.Decimal(input.amount),
    balance: new Prisma.Decimal(input.amount),
    status: "PENDING" as const,
    recipientName: input.recipientName?.trim() || null,
    recipientEmail: input.recipientEmail?.trim().toLowerCase() || null,
    recipientPhone: input.recipientPhone?.replace(/\D/g, "") || null,
    message: input.message?.trim() || "",
    deliveryDate: input.deliveryDate ?? null,
    giftCardProductId: input.giftCardProductId ?? null,
    sourceOrderId: input.sourceOrderId,
    purchasedByCustomerId: input.purchasedByCustomerId ?? null,
    expiresAt,
    enabled: true,
    txns: {
      create: {
        type: "ISSUE" as const,
        amount: new Prisma.Decimal(input.amount),
        orderId: input.sourceOrderId,
        customerId: input.purchasedByCustomerId ?? null,
        reason: "Issued pending payment",
      },
    },
  };
}

export async function sendActivatedGiftCardEmails(
  rows: ActivatedGiftCardEmail[]
): Promise<void> {
  for (const row of rows) {
    if (row.to) {
      sendGiftCardEmail({
        to: row.to,
        code: row.code,
        amountKwd: row.amount,
        recipientName: row.recipientName,
        message: row.message,
      }).catch(() => {});
    }
    if (row.phone) {
      sendGiftCardWhatsApp({
        to: row.phone,
        code: row.code,
        amountKwd: row.amount,
        recipientName: row.recipientName,
        message: row.message,
      }).catch(() => {});
    }
  }
}
