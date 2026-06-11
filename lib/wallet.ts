import { Prisma, type PrismaClient } from "@prisma/client";

type TxClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export async function getCustomerStoreCredit(
  tx: TxClient,
  customerId: string
): Promise<number> {
  const row = await tx.customer.findUnique({
    where: { id: customerId },
    select: { storeCredit: true },
  });
  return row ? round3(Number(row.storeCredit)) : 0;
}

export async function creditCustomerWallet(
  tx: TxClient,
  input: {
    customerId: string;
    amount: number;
    type: "GIFT_CARD_REDEEM" | "ADMIN_CREDIT" | "LOYALTY_CODE_OVERFLOW";
    giftCardId?: string;
    orderId?: string;
    reason?: string;
  }
): Promise<number> {
  const amount = round3(input.amount);
  if (amount <= 0) throw new Error("Credit amount must be positive");

  const customer = await tx.customer.findUnique({
    where: { id: input.customerId },
    select: { storeCredit: true },
  });
  if (!customer) throw new Error("Customer not found");

  const next = round3(Number(customer.storeCredit) + amount);
  await tx.customer.update({
    where: { id: input.customerId },
    data: { storeCredit: new Prisma.Decimal(next) },
  });
  await tx.customerWalletTxn.create({
    data: {
      customerId: input.customerId,
      type: input.type,
      amount: new Prisma.Decimal(amount),
      balanceAfter: new Prisma.Decimal(next),
      giftCardId: input.giftCardId ?? null,
      orderId: input.orderId ?? null,
      reason: input.reason ?? "",
    },
  });
  return next;
}

export async function debitCustomerWallet(
  tx: TxClient,
  input: {
    customerId: string;
    amount: number;
    type: "CHECKOUT_APPLY" | "ADMIN_DEBIT";
    orderId?: string;
    reason?: string;
  }
): Promise<number> {
  const amount = round3(input.amount);
  if (amount <= 0) throw new Error("Debit amount must be positive");

  const customer = await tx.customer.findUnique({
    where: { id: input.customerId },
    select: { storeCredit: true },
  });
  if (!customer) throw new Error("Customer not found");

  const current = round3(Number(customer.storeCredit));
  if (amount > current + 0.0001) {
    throw new Error("Insufficient store credit");
  }

  const next = round3(current - amount);
  await tx.customer.update({
    where: { id: input.customerId },
    data: { storeCredit: new Prisma.Decimal(next) },
  });
  await tx.customerWalletTxn.create({
    data: {
      customerId: input.customerId,
      type: input.type,
      amount: new Prisma.Decimal(-amount),
      balanceAfter: new Prisma.Decimal(next),
      orderId: input.orderId ?? null,
      reason: input.reason ?? "",
    },
  });
  return next;
}

export function clampStoreCreditApply(
  storeCredit: number,
  orderTotal: number
): number {
  return round3(Math.min(Math.max(0, storeCredit), Math.max(0, orderTotal)));
}
