import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { isPrismaConnectionError } from "@/lib/db-safe";
import { toPublicCustomer } from "@/lib/customer-auth/public";
import type { PublicCustomer } from "@/lib/customer-auth/types";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SEC,
} from "@/lib/customer-auth/constants";
import { getLoyaltySettings } from "@/lib/loyalty-settings";
import { refreshCustomerLoyaltyState } from "@/actions/loyalty-redeem";

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Set the session cookie. */
export async function setCustomerSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });
}

/** Clear the session cookie. */
export async function clearCustomerSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE_NAME);
}

/** Read the raw session token from the request cookies. */
export async function readSessionToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE_NAME)?.value ?? null;
}

/**
 * Resolve the currently logged-in customer (or null) from the session cookie.
 * Includes relations needed for the account dashboard.
 */
export async function getCurrentCustomer(): Promise<PublicCustomer | null> {
  const token = await readSessionToken();
  if (!token) return null;

  try {
    const session = await prisma.customerSession.findUnique({
      where: { token },
      select: { id: true, customerId: true, expiresAt: true },
    });
    if (!session) return null;
    if (session.expiresAt < new Date()) {
      // Expired — clean it up.
      await prisma.customerSession
        .delete({ where: { id: session.id } })
        .catch(() => {});
      return null;
    }

    await refreshCustomerLoyaltyState(session.customerId).catch(() => {});

    const [customer, settings, expiring, codes] = await Promise.all([
      prisma.customer.findUnique({
        where: { id: session.customerId },
        include: {
          addresses: { orderBy: { createdAt: "asc" } },
          orders: { orderBy: { createdAt: "desc" }, take: 30 },
          loyaltyTxns: { orderBy: { createdAt: "desc" }, take: 50 },
          giftCardsOwned: true,
          walletTxns: { orderBy: { createdAt: "desc" }, take: 30 },
          wishlist: {
            include: { product: true },
            orderBy: { createdAt: "desc" },
          },
        },
      }),
      getLoyaltySettings(),
      prisma.loyaltyPointLot.aggregate({
        where: {
          customerId: session.customerId,
          pointsRemaining: { gt: 0 },
          expiresAt: {
            gt: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
        _sum: { pointsRemaining: true },
      }),
      prisma.loyaltyRedemptionCode.findMany({
        where: {
          customerId: session.customerId,
          status: { in: ["ACTIVE", "PARTIALLY_USED"] },
          balanceKwd: { gt: 0 },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    if (!customer) return null;

    return toPublicCustomer(customer, {
      loyaltySettings: settings,
      expiringPoints: expiring._sum.pointsRemaining ?? 0,
      redemptionCodes: codes.map((r) => ({
        id: r.id,
        code: r.code,
        balanceKwd: Number(r.balanceKwd),
        initialValueKwd: Number(r.initialValueKwd),
        pointsRedeemed: r.pointsRedeemed,
        expiresAtIso: r.expiresAt?.toISOString() ?? null,
        status: r.status,
      })),
    });
  } catch (e) {
    if (isPrismaConnectionError(e)) return null;
    throw e;
  }
}

/** Same as above but returns only the bare id (cheap). */
export async function getCurrentCustomerId(): Promise<string | null> {
  const token = await readSessionToken();
  if (!token) return null;
  try {
    const s = await prisma.customerSession.findUnique({
      where: { token },
      select: { customerId: true, expiresAt: true },
    });
    if (!s || s.expiresAt < new Date()) return null;
    return s.customerId;
  } catch (e) {
    if (isPrismaConnectionError(e)) return null;
    throw e;
  }
}
