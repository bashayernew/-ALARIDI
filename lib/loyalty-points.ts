import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { LoyaltySettingsDTO } from "@/lib/loyalty-settings";
import {
  DEFAULT_LOYALTY_SETTINGS,
  resolveTierFromSettings,
} from "@/lib/loyalty-settings";
import { pointsEarnedForSubtotal } from "@/lib/loyalty";

type TxClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

export { pointsEarnedForSubtotal };

export async function syncCustomerPointsBalance(
  tx: TxClient,
  customerId: string
): Promise<number> {
  const now = new Date();
  const lots = await tx.loyaltyPointLot.findMany({
    where: { customerId, pointsRemaining: { gt: 0 }, expiresAt: { gt: now } },
  });
  const balance = lots.reduce((sum, lot) => sum + lot.pointsRemaining, 0);
  await tx.customer.update({
    where: { id: customerId },
    data: { loyaltyBalance: balance },
  });
  return balance;
}

export async function expireCustomerPoints(
  tx: TxClient,
  customerId: string
): Promise<number> {
  const now = new Date();
  const expiredLots = await tx.loyaltyPointLot.findMany({
    where: {
      customerId,
      pointsRemaining: { gt: 0 },
      expiresAt: { lte: now },
    },
  });

  let expiredTotal = 0;
  for (const lot of expiredLots) {
    expiredTotal += lot.pointsRemaining;
    await tx.loyaltyPointLot.update({
      where: { id: lot.id },
      data: { pointsRemaining: 0 },
    });
    await tx.loyaltyTxn.create({
      data: {
        customerId,
        type: "EXPIRE",
        points: -lot.pointsRemaining,
        reason: `Points expired (${lot.pointsInitial} lot)`,
        expiresAt: lot.expiresAt,
      },
    });
  }

  if (expiredTotal > 0) {
    await syncCustomerPointsBalance(tx, customerId);
  }
  return expiredTotal;
}

export async function creditPoints(
  tx: TxClient,
  input: {
    customerId: string;
    points: number;
    type:
      | "EARN_ORDER"
      | "EARN_BONUS_FIRST_ORDER"
      | "EARN_BONUS_BIRTHDAY"
      | "EARN_BONUS_REFERRAL"
      | "EARN_BONUS_CAMPAIGN"
      | "ADJUST_ADMIN";
    reason: string;
    orderId?: string;
    settings: LoyaltySettingsDTO;
  }
): Promise<void> {
  if (input.points <= 0) return;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + input.settings.pointsExpiryDays);

  const txn = await tx.loyaltyTxn.create({
    data: {
      customerId: input.customerId,
      orderId: input.orderId ?? null,
      type: input.type,
      points: input.points,
      reason: input.reason,
      expiresAt,
    },
  });

  await tx.loyaltyPointLot.create({
    data: {
      customerId: input.customerId,
      sourceTxnId: txn.id,
      pointsInitial: input.points,
      pointsRemaining: input.points,
      expiresAt,
    },
  });

  await tx.customer.update({
    where: { id: input.customerId },
    data: {
      loyaltyBalance: { increment: input.points },
      lifetimePoints: { increment: input.points },
    },
  });
}

export async function debitPointsFifo(
  tx: TxClient,
  input: {
    customerId: string;
    points: number;
    type: "REDEEM_ORDER";
    reason: string;
  }
): Promise<void> {
  if (input.points <= 0) return;

  await expireCustomerPoints(tx, input.customerId);

  const lots = await tx.loyaltyPointLot.findMany({
    where: {
      customerId: input.customerId,
      pointsRemaining: { gt: 0 },
      expiresAt: { gt: new Date() },
    },
    orderBy: { expiresAt: "asc" },
  });

  let remaining = input.points;
  for (const lot of lots) {
    if (remaining <= 0) break;
    const take = Math.min(lot.pointsRemaining, remaining);
    await tx.loyaltyPointLot.update({
      where: { id: lot.id },
      data: { pointsRemaining: lot.pointsRemaining - take },
    });
    remaining -= take;
  }

  if (remaining > 0) {
    throw new Error("Insufficient points");
  }

  await tx.loyaltyTxn.create({
    data: {
      customerId: input.customerId,
      type: input.type,
      points: -input.points,
      reason: input.reason,
    },
  });

  await syncCustomerPointsBalance(tx, input.customerId);
}

export async function getExpiringPointsSummary(
  customerId: string,
  withinDays = 30
): Promise<{ points: number; soonestExpiry: Date | null }> {
  const now = new Date();
  const until = new Date();
  until.setDate(until.getDate() + withinDays);

  const lots = await prisma.loyaltyPointLot.findMany({
    where: {
      customerId,
      pointsRemaining: { gt: 0 },
      expiresAt: { gt: now, lte: until },
    },
    orderBy: { expiresAt: "asc" },
  });

  return {
    points: lots.reduce((s, l) => s + l.pointsRemaining, 0),
    soonestExpiry: lots[0]?.expiresAt ?? null,
  };
}

export async function awardLoyaltyForPaidOrder(
  tx: TxClient,
  orderId: string
): Promise<void> {
  const settingsRow = await tx.loyaltySettings.findUnique({
    where: { id: "default" },
  });
  const settings: LoyaltySettingsDTO = settingsRow
    ? {
        enabled: settingsRow.enabled,
        pointsExpiryDays: settingsRow.pointsExpiryDays,
        silverEarnPercent: Number(settingsRow.silverEarnPercent),
        goldEarnPercent: Number(settingsRow.goldEarnPercent),
        platinumEarnPercent: Number(settingsRow.platinumEarnPercent),
        redemptionPoints: settingsRow.redemptionPoints,
        redemptionValueKwd: Number(settingsRow.redemptionValueKwd),
        minPointsToRedeem: settingsRow.minPointsToRedeem,
        firstOrderBonusPoints: settingsRow.firstOrderBonusPoints,
        birthdayBonusPoints: settingsRow.birthdayBonusPoints,
        referralBonusPoints: settingsRow.referralBonusPoints,
        silverThreshold: settingsRow.silverThreshold,
        goldThreshold: settingsRow.goldThreshold,
        platinumThreshold: settingsRow.platinumThreshold,
      }
    : DEFAULT_LOYALTY_SETTINGS;

  if (!settings.enabled) return;

  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { customer: true },
  });
  if (!order?.customerUserId || !order.customer) return;

  const alreadyAwarded = await tx.loyaltyTxn.findFirst({
    where: {
      orderId,
      type: { in: ["EARN_ORDER", "EARN_BONUS_FIRST_ORDER"] },
    },
  });
  if (alreadyAwarded) return;

  await expireCustomerPoints(tx, order.customerUserId);

  if (order.pointsEarned > 0) {
    await creditPoints(tx, {
      customerId: order.customerUserId,
      points: order.pointsEarned,
      type: "EARN_ORDER",
      reason: `Earned on paid order ${order.id.slice(0, 8)}`,
      orderId: order.id,
      settings,
    });
  }

  const firstOrderBonus =
    !order.customer.firstOrderBonusGiven && settings.firstOrderBonusPoints > 0
      ? settings.firstOrderBonusPoints
      : 0;

  if (firstOrderBonus > 0) {
    await creditPoints(tx, {
      customerId: order.customerUserId,
      points: firstOrderBonus,
      type: "EARN_BONUS_FIRST_ORDER",
      reason: "First-order bonus",
      orderId: order.id,
      settings,
    });
  }

  const updated = await tx.customer.findUnique({
    where: { id: order.customerUserId },
  });
  if (updated) {
    await tx.customer.update({
      where: { id: order.customerUserId },
      data: {
        tier: resolveTierFromSettings(updated.lifetimePoints, settings),
        firstOrderBonusGiven:
          updated.firstOrderBonusGiven || firstOrderBonus > 0,
      },
    });
  }
}
