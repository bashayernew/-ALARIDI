"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/actions/admin-auth";
import {
  DEFAULT_LOYALTY_SETTINGS,
  type LoyaltySettingsDTO,
} from "@/lib/loyalty-settings";

async function requireAdmin() {
  if (!(await isAdminSession())) throw new Error("Unauthorized");
}

export type LoyaltySettingsInput = LoyaltySettingsDTO;

export async function getLoyaltySettingsAdmin(): Promise<LoyaltySettingsDTO> {
  await requireAdmin();
  const row = await prisma.loyaltySettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...DEFAULT_LOYALTY_SETTINGS },
    update: {},
  });
  return {
    enabled: row.enabled,
    pointsExpiryDays: row.pointsExpiryDays,
    silverEarnPercent: Number(row.silverEarnPercent),
    goldEarnPercent: Number(row.goldEarnPercent),
    platinumEarnPercent: Number(row.platinumEarnPercent),
    redemptionPoints: row.redemptionPoints,
    redemptionValueKwd: Number(row.redemptionValueKwd),
    minPointsToRedeem: row.minPointsToRedeem,
    firstOrderBonusPoints: row.firstOrderBonusPoints,
    birthdayBonusPoints: row.birthdayBonusPoints,
    referralBonusPoints: row.referralBonusPoints,
    silverThreshold: row.silverThreshold,
    goldThreshold: row.goldThreshold,
    platinumThreshold: row.platinumThreshold,
  };
}

export async function updateLoyaltySettings(input: LoyaltySettingsInput) {
  await requireAdmin();
  await prisma.loyaltySettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...input },
    update: {
      enabled: input.enabled,
      pointsExpiryDays: input.pointsExpiryDays,
      silverEarnPercent: input.silverEarnPercent,
      goldEarnPercent: input.goldEarnPercent,
      platinumEarnPercent: input.platinumEarnPercent,
      redemptionPoints: input.redemptionPoints,
      redemptionValueKwd: input.redemptionValueKwd,
      minPointsToRedeem: input.minPointsToRedeem,
      firstOrderBonusPoints: input.firstOrderBonusPoints,
      birthdayBonusPoints: input.birthdayBonusPoints,
      referralBonusPoints: input.referralBonusPoints,
      silverThreshold: input.silverThreshold,
      goldThreshold: input.goldThreshold,
      platinumThreshold: input.platinumThreshold,
    },
  });
  revalidatePath("/admin/loyalty");
  revalidatePath("/loyalty");
  revalidatePath("/account");
  revalidatePath("/checkout");
}

export async function getCustomerLoyaltyAdmin(customerId: string) {
  await requireAdmin();
  const [customer, txns, codes, earnedAgg, spentAgg, expiredAgg] =
    await Promise.all([
    prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
        email: true,
        tier: true,
        loyaltyBalance: true,
        lifetimePoints: true,
        storeCredit: true,
      },
    }),
    prisma.loyaltyTxn.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.loyaltyRedemptionCode.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.loyaltyTxn.aggregate({
      where: {
        customerId,
        points: { gt: 0 },
        NOT: { type: "EXPIRE" },
      },
      _sum: { points: true },
    }),
    prisma.loyaltyTxn.aggregate({
      where: {
        customerId,
        points: { lt: 0 },
        NOT: { type: "EXPIRE" },
      },
      _sum: { points: true },
    }),
    prisma.loyaltyTxn.aggregate({
      where: { customerId, type: "EXPIRE" },
      _sum: { points: true },
    }),
  ]);
  if (!customer) throw new Error("Customer not found");
  return {
    customer: {
      ...customer,
      // Convert the Prisma Decimal to a plain number so it can cross to the client.
      storeCredit: Number(customer.storeCredit),
      storeCreditKwd: Number(customer.storeCredit),
    },
    stats: {
      earned: earnedAgg._sum.points ?? 0,
      spent: Math.abs(spentAgg._sum.points ?? 0),
      expired: Math.abs(expiredAgg._sum.points ?? 0),
    },
    txns: txns.map((t) => ({
      id: t.id,
      type: t.type,
      points: t.points,
      reason: t.reason,
      expiresAtIso: t.expiresAt?.toISOString() ?? null,
      createdAtIso: t.createdAt.toISOString(),
    })),
    codes: codes.map((c) => ({
      id: c.id,
      code: c.code,
      status: c.status,
      balanceKwd: Number(c.balanceKwd),
      pointsRedeemed: c.pointsRedeemed,
      createdAtIso: c.createdAt.toISOString(),
    })),
  };
}

export async function searchCustomersForLoyalty(query: string) {
  await requireAdmin();
  const q = query.trim();
  if (!q) return [];
  const rows = await prisma.customer.findMany({
    where: {
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      tier: true,
      loyaltyBalance: true,
    },
    orderBy: { name: "asc" },
    take: 15,
  });
  return rows;
}

export type CustomerLoyaltyAdminDetail = Awaited<
  ReturnType<typeof getCustomerLoyaltyAdmin>
>;
