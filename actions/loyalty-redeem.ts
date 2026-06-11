"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  getLoyaltySettings,
  pointsToKwdValue,
  snapRedeemPoints,
} from "@/lib/loyalty-settings";
import {
  debitPointsFifo,
  expireCustomerPoints,
  syncCustomerPointsBalance,
} from "@/lib/loyalty-points";
import {
  generateLoyaltyRedemptionCode,
  validateLoyaltyRedemptionForCheckout,
} from "@/lib/loyalty-redemption";
import { getCurrentCustomerId } from "@/lib/customer-auth/server";
import { isPrismaConnectionError } from "@/lib/db-safe";

export async function redeemLoyaltyPointsForCode(input: {
  points: number;
}): Promise<
  | { ok: true; code: string; valueKwd: number; points: number }
  | { ok: false; error: string }
> {
  const customerId = await getCurrentCustomerId();
  if (!customerId) return { ok: false, error: "login_required" };

  const settings = await getLoyaltySettings();
  if (!settings.enabled) return { ok: false, error: "disabled" };

  await refreshCustomerLoyaltyState(customerId);
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });
  if (!customer) return { ok: false, error: "login_required" };

  const points = snapRedeemPoints(
    input.points,
    customer.loyaltyBalance,
    settings
  );
  if (points < settings.minPointsToRedeem) {
    return { ok: false, error: "min_points" };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      await expireCustomerPoints(tx, customerId);
      const fresh = await tx.customer.findUnique({ where: { id: customerId } });
      if (!fresh || fresh.loyaltyBalance < points) {
        throw new Error("Insufficient points");
      }

      const valueKwd = pointsToKwdValue(points, settings);
      let code = generateLoyaltyRedemptionCode();
      for (let i = 0; i < 5; i++) {
        const exists = await tx.loyaltyRedemptionCode.findUnique({
          where: { code },
        });
        if (!exists) break;
        code = generateLoyaltyRedemptionCode();
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + settings.pointsExpiryDays);

      await debitPointsFifo(tx, {
        customerId,
        points,
        type: "REDEEM_ORDER",
        reason: `Redeemed for checkout code ${code}`,
      });

      await tx.loyaltyRedemptionCode.create({
        data: {
          code,
          customerId,
          pointsRedeemed: points,
          initialValueKwd: valueKwd,
          balanceKwd: valueKwd,
          expiresAt,
        },
      });

      await syncCustomerPointsBalance(tx, customerId);
      return { code, valueKwd, points };
    });

    revalidatePath("/account");
    revalidatePath("/checkout");
    return { ok: true, ...result };
  } catch (e) {
    if (e instanceof Error && e.message === "Insufficient points") {
      return { ok: false, error: "insufficient" };
    }
    if (isPrismaConnectionError(e)) {
      return { ok: false, error: "service_unavailable" };
    }
    throw e;
  }
}

export async function validateLoyaltyCodeAtCheckout(input: {
  code: string;
  orderTotalKwd: number;
}): Promise<
  | {
      ok: true;
      code: string;
      discountKwd: number;
      walletOverflowKwd: number;
    }
  | {
      ok: false;
      code:
        | "not_found"
        | "disabled"
        | "wrong_customer"
        | "expired"
        | "empty"
        | "login_required"
        | "service_unavailable";
    }
> {
  const customerId = await getCurrentCustomerId();
  if (!customerId) return { ok: false, code: "login_required" };

  const codeKey = input.code.trim().toUpperCase();
  if (!codeKey) return { ok: false, code: "not_found" };

  try {
    const row = await prisma.loyaltyRedemptionCode.findUnique({
      where: { code: codeKey },
    });
    const v = validateLoyaltyRedemptionForCheckout(
      row,
      customerId,
      input.orderTotalKwd
    );
    if (!v.ok) return { ok: false, code: v.code };
    return {
      ok: true,
      code: v.code,
      discountKwd: v.discountKwd,
      walletOverflowKwd: v.walletOverflowKwd,
    };
  } catch (e) {
    if (isPrismaConnectionError(e)) {
      return { ok: false, code: "service_unavailable" };
    }
    throw e;
  }
}

export async function getMyLoyaltyRedemptionCodes() {
  const customerId = await getCurrentCustomerId();
  if (!customerId) return [];
  const rows = await prisma.loyaltyRedemptionCode.findMany({
    where: {
      customerId,
      status: { in: ["ACTIVE", "PARTIALLY_USED"] },
      balanceKwd: { gt: 0 },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    balanceKwd: Number(r.balanceKwd),
    initialValueKwd: Number(r.initialValueKwd),
    pointsRedeemed: r.pointsRedeemed,
    expiresAtIso: r.expiresAt?.toISOString() ?? null,
    status: r.status,
  }));
}

export async function refreshCustomerLoyaltyState(customerId: string) {
  await prisma.$transaction(async (tx) => {
    await expireCustomerPoints(tx, customerId);
    await syncCustomerPointsBalance(tx, customerId);
  });
}

export async function loadCustomerLoyaltyContext(customerId: string) {
  await refreshCustomerLoyaltyState(customerId);
  const [settings, expiring] = await Promise.all([
    getLoyaltySettings(),
    prisma.loyaltyPointLot.aggregate({
      where: {
        customerId,
        pointsRemaining: { gt: 0 },
        expiresAt: {
          gt: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
      _sum: { pointsRemaining: true },
    }),
  ]);
  return {
    settings,
    expiringPoints: expiring._sum.pointsRemaining ?? 0,
  };
}
