import { randomBytes } from "crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { creditCustomerWallet } from "@/lib/wallet";

type TxClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

export function generateLoyaltyRedemptionCode(): string {
  return `LR-${randomBytes(6).toString("hex").toUpperCase()}`;
}

export type LoyaltyCodeValidation =
  | {
      ok: true;
      codeId: string;
      code: string;
      balanceKwd: number;
      discountKwd: number;
      walletOverflowKwd: number;
    }
  | {
      ok: false;
      code:
        | "not_found"
        | "disabled"
        | "expired"
        | "empty"
        | "wrong_customer";
    };

export function validateLoyaltyRedemptionForCheckout(
  row: {
    id: string;
    code: string;
    customerId: string;
    balanceKwd: { toString(): string } | number;
    status: string;
    expiresAt: Date | null;
  } | null,
  customerId: string | null,
  orderTotalKwd: number,
  now: Date = new Date()
): LoyaltyCodeValidation {
  if (!row) return { ok: false, code: "not_found" };
  if (!customerId || row.customerId !== customerId) {
    return { ok: false, code: "wrong_customer" };
  }
  // Only codes that still have spendable balance may be applied. Anything that
  // has already been used (FULLY_USED), expired, or is otherwise not active is
  // rejected so a used code can never be re-applied at checkout.
  if (row.status !== "ACTIVE" && row.status !== "PARTIALLY_USED") {
    return { ok: false, code: "empty" };
  }
  if (row.expiresAt && row.expiresAt < now) {
    return { ok: false, code: "expired" };
  }
  const balance = round3(Number(row.balanceKwd));
  if (balance <= 0) return { ok: false, code: "empty" };

  const discountKwd = round3(Math.min(balance, Math.max(0, orderTotalKwd)));
  const walletOverflowKwd = round3(Math.max(0, balance - discountKwd));

  return {
    ok: true,
    codeId: row.id,
    code: row.code,
    balanceKwd: balance,
    discountKwd,
    walletOverflowKwd,
  };
}

export async function applyLoyaltyRedemptionAtCheckout(
  tx: TxClient,
  input: {
    codeId: string;
    customerId: string;
    orderId: string;
    discountKwd: number;
    walletOverflowKwd: number;
  }
): Promise<void> {
  const row = await tx.loyaltyRedemptionCode.findUnique({
    where: { id: input.codeId },
  });
  if (!row) throw new Error("Loyalty code not found");

  const balance = round3(Number(row.balanceKwd));
  const used = round3(input.discountKwd + input.walletOverflowKwd);
  if (used > balance + 0.0001) throw new Error("Invalid loyalty code amount");

  const nextBalance = round3(Math.max(0, balance - used));
  await tx.loyaltyRedemptionCode.update({
    where: { id: input.codeId },
    data: {
      balanceKwd: new Prisma.Decimal(nextBalance),
      status: nextBalance <= 0 ? "FULLY_USED" : "PARTIALLY_USED",
    },
  });

  if (input.walletOverflowKwd > 0) {
    await creditCustomerWallet(tx, {
      customerId: input.customerId,
      amount: input.walletOverflowKwd,
      type: "LOYALTY_CODE_OVERFLOW",
      orderId: input.orderId,
      reason: `Loyalty code ${row.code} remainder`,
    });
  }
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
