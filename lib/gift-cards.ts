import { randomBytes } from "crypto";
import type { GiftCard, GiftCardStatus } from "@prisma/client";

export const GIFT_CARD_PRESET_AMOUNTS = [10, 25, 50] as const;

export type GiftCardValidation =
  | {
      ok: true;
      giftCard: GiftCard;
      balance: number;
    }
  | {
      ok: false;
      code:
        | "not_found"
        | "disabled"
        | "expired"
        | "empty"
        | "pending"
        | "already_redeemed";
    };

export type GiftCardRedeemValidation =
  | GiftCardValidation
  | { ok: false; code: "wrong_recipient" | "not_active" };

/** Cryptographically strong gift card code (generated after payment). */
export function generateGiftCardCode(): string {
  const part = randomBytes(8).toString("hex").toUpperCase();
  return `GC-${part}`;
}

/** Internal placeholder until payment confirms — not redeemable. */
export function generatePendingGiftCardCode(): string {
  return `PND-${randomBytes(12).toString("hex").toUpperCase()}`;
}

export function isPendingGiftCardCode(code: string): boolean {
  return code.startsWith("PND-");
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export function giftCardBalance(card: GiftCard): number {
  return round3(Number(card.balance));
}

export function normalizeRecipientEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

export function normalizeRecipientPhone(phone: string | null | undefined): string {
  return (phone ?? "").replace(/\D/g, "");
}

export function recipientMatchesGiftCard(
  card: Pick<GiftCard, "recipientEmail" | "recipientPhone">,
  email: string | null | undefined,
  phone: string | null | undefined
): boolean {
  const targetEmail = normalizeRecipientEmail(email);
  const targetPhone = normalizeRecipientPhone(phone);
  const cardEmail = normalizeRecipientEmail(card.recipientEmail);
  const cardPhone = normalizeRecipientPhone(card.recipientPhone);

  if (cardEmail && targetEmail && cardEmail === targetEmail) return true;
  if (cardPhone && targetPhone && cardPhone === targetPhone) return true;
  return false;
}

export function validateGiftCardRow(
  card: GiftCard | null,
  now: Date = new Date()
): GiftCardValidation {
  if (!card) return { ok: false, code: "not_found" };
  if (card.status === "PENDING") return { ok: false, code: "pending" };
  if (card.status === "DISABLED" || !card.enabled) {
    return { ok: false, code: "disabled" };
  }
  if (card.status === "EXPIRED") return { ok: false, code: "expired" };
  if (card.status === "REDEEMED") return { ok: false, code: "already_redeemed" };
  if (card.expiresAt && card.expiresAt < now) {
    return { ok: false, code: "expired" };
  }
  const balance = giftCardBalance(card);
  if (balance <= 0) {
    if (card.status === "PARTIALLY_USED") {
      return { ok: false, code: "empty" };
    }
    return { ok: false, code: "empty" };
  }
  return { ok: true, giftCard: card, balance };
}

export function validateGiftCardForRedemption(
  card: GiftCard | null,
  email: string | null | undefined,
  phone: string | null | undefined,
  now: Date = new Date()
): GiftCardRedeemValidation {
  const base = validateGiftCardRow(card, now);
  if (!base.ok) return base;
  if (card!.status !== "ACTIVE" && card!.status !== "PARTIALLY_USED") {
    return { ok: false, code: "not_active" };
  }
  if (!recipientMatchesGiftCard(card!, email, phone)) {
    return { ok: false, code: "wrong_recipient" };
  }
  return base;
}

export function applyGiftCardBalance(balance: number, orderTotal: number) {
  const used = Math.min(balance, orderTotal);
  return {
    used: round3(used),
    remainingBalance: round3(balance - used),
    remainingOrderTotal: round3(orderTotal - used),
  };
}

export function giftCardStatusLabel(status: GiftCardStatus): string {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "ACTIVE":
      return "Active";
    case "REDEEMED":
      return "Redeemed";
    case "PARTIALLY_USED":
      return "Partially used";
    case "EXPIRED":
      return "Expired";
    case "DISABLED":
      return "Disabled";
    default:
      return status;
  }
}

export function resolveGiftCardAmount(
  product: {
    price: { toString(): string } | number;
    allowCustomAmount: boolean;
    presetAmounts: ({ toString(): string } | number)[];
    minCustomAmount: { toString(): string } | number | null;
    maxCustomAmount: { toString(): string } | number | null;
  },
  requestedAmount?: number | null
): number | null {
  const basePrice = Number(product.price);
  const presets = product.presetAmounts.map(Number).filter((n) => n > 0);
  const amount = requestedAmount != null ? Number(requestedAmount) : basePrice;

  if (!Number.isFinite(amount) || amount <= 0) return null;

  if (presets.length > 0 && presets.includes(amount)) return round3(amount);

  if (product.allowCustomAmount) {
    const min = product.minCustomAmount != null ? Number(product.minCustomAmount) : 1;
    const max =
      product.maxCustomAmount != null ? Number(product.maxCustomAmount) : 500;
    if (amount >= min && amount <= max) return round3(amount);
    return null;
  }

  if (presets.length === 0 && Math.abs(amount - basePrice) < 0.001) {
    return round3(basePrice);
  }

  if (presets.length > 0) return null;
  return round3(amount);
}
