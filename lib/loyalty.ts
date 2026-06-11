import type { LoyaltyTier } from "@prisma/client";
import type { LoyaltySettingsDTO } from "@/lib/loyalty-settings";
import { tierEarnPercent } from "@/lib/loyalty-settings";

/** 100 points = 0.500 KWD (configurable via settings). */
export const REDEMPTION_POINTS = 100;
export const REDEMPTION_VALUE_KWD = 0.5;

export function pointsEarnedForSubtotal(
  subtotalKwd: number,
  tier: LoyaltyTier,
  settings: LoyaltySettingsDTO
): number {
  const pct = tierEarnPercent(tier, settings) / 100;
  if (pct <= 0 || subtotalKwd <= 0) return 0;
  const earnKwd = subtotalKwd * pct;
  const pointsPerKwd =
    settings.redemptionValueKwd > 0
      ? settings.redemptionPoints / settings.redemptionValueKwd
      : 0;
  return Math.floor(earnKwd * pointsPerKwd);
}

/** @deprecated Use pointsEarnedForSubtotal with settings */
export function pointsEarnedFor(
  subtotalKwd: number,
  tier: LoyaltyTier = "SILVER"
): number {
  return pointsEarnedForSubtotal(subtotalKwd, tier, {
    enabled: true,
    pointsExpiryDays: 365,
    silverEarnPercent: 2,
    goldEarnPercent: 2.5,
    platinumEarnPercent: 3,
    redemptionPoints: REDEMPTION_POINTS,
    redemptionValueKwd: REDEMPTION_VALUE_KWD,
    minPointsToRedeem: 100,
    firstOrderBonusPoints: 200,
    birthdayBonusPoints: 500,
    referralBonusPoints: 250,
    silverThreshold: 0,
    goldThreshold: 500,
    platinumThreshold: 2000,
  });
}

export function resolveTier(lifetimePoints: number): LoyaltyTier {
  if (lifetimePoints >= 2000) return "PLATINUM";
  if (lifetimePoints >= 500) return "GOLD";
  return "SILVER";
}
