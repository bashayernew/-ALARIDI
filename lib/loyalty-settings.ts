import type { LoyaltySettings, LoyaltyTier } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type LoyaltySettingsDTO = {
  enabled: boolean;
  pointsExpiryDays: number;
  silverEarnPercent: number;
  goldEarnPercent: number;
  platinumEarnPercent: number;
  redemptionPoints: number;
  redemptionValueKwd: number;
  minPointsToRedeem: number;
  firstOrderBonusPoints: number;
  birthdayBonusPoints: number;
  referralBonusPoints: number;
  silverThreshold: number;
  goldThreshold: number;
  platinumThreshold: number;
};

export const DEFAULT_LOYALTY_SETTINGS: LoyaltySettingsDTO = {
  enabled: true,
  pointsExpiryDays: 365,
  silverEarnPercent: 2,
  goldEarnPercent: 2.5,
  platinumEarnPercent: 3,
  redemptionPoints: 100,
  redemptionValueKwd: 0.5,
  minPointsToRedeem: 100,
  firstOrderBonusPoints: 200,
  birthdayBonusPoints: 500,
  referralBonusPoints: 250,
  silverThreshold: 0,
  goldThreshold: 500,
  platinumThreshold: 2000,
};

function mapSettings(row: LoyaltySettings): LoyaltySettingsDTO {
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

export async function getLoyaltySettings(): Promise<LoyaltySettingsDTO> {
  const row = await prisma.loyaltySettings.findUnique({
    where: { id: "default" },
  });
  if (!row) {
    return DEFAULT_LOYALTY_SETTINGS;
  }
  return mapSettings(row);
}

export async function ensureLoyaltySettings(): Promise<LoyaltySettingsDTO> {
  const row = await prisma.loyaltySettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...DEFAULT_LOYALTY_SETTINGS },
    update: {},
  });
  return mapSettings(row);
}

export function tierEarnPercent(
  tier: LoyaltyTier,
  settings: LoyaltySettingsDTO
): number {
  switch (tier) {
    case "GOLD":
      return settings.goldEarnPercent;
    case "PLATINUM":
      return settings.platinumEarnPercent;
    default:
      return settings.silverEarnPercent;
  }
}

export function resolveTierFromSettings(
  lifetimePoints: number,
  settings: LoyaltySettingsDTO
): LoyaltyTier {
  if (lifetimePoints >= settings.platinumThreshold) return "PLATINUM";
  if (lifetimePoints >= settings.goldThreshold) return "GOLD";
  return "SILVER";
}

export function pointsToKwdValue(
  points: number,
  settings: LoyaltySettingsDTO
): number {
  if (settings.redemptionPoints <= 0) return 0;
  return round3(
    (points / settings.redemptionPoints) * settings.redemptionValueKwd
  );
}

export function snapRedeemPoints(
  points: number,
  maxAvailable: number,
  settings: LoyaltySettingsDTO
): number {
  const step = settings.redemptionPoints;
  const snapped = Math.floor(points / step) * step;
  return Math.min(Math.max(0, snapped), maxAvailable);
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
