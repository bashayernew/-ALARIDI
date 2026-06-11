import type { LoyaltyTier } from "@prisma/client";

export type CustomerOrderSummary = {
  id: string;
  dateIso: string;
  totalKwd: number;
  status: string;
  fulfillmentType: string;
};

export type CustomerAddress = {
  id: string;
  label: string;
  /** Matches `DELIVERY_AREAS[].id` */
  deliveryAreaId: string;
  street: string;
  building: string;
  block: string;
  city: string;
  houseNumber: string;
  floor: string;
  doorNumber: string;
  additionalNotes: string;
  latitude: number | null;
  longitude: number | null;
};

export type CustomerReward = {
  id: string;
  dateIso: string;
  points: number;
  description: string;
  type: string;
  expiresAtIso: string | null;
};

export type CustomerLoyaltyCode = {
  id: string;
  code: string;
  balanceKwd: number;
  initialValueKwd: number;
  pointsRedeemed: number;
  expiresAtIso: string | null;
  status: string;
};

export type CustomerWalletTxn = {
  id: string;
  dateIso: string;
  type: string;
  amountKwd: number;
  balanceAfterKwd: number;
  reason: string;
};

export type CustomerGiftCard = {
  id: string;
  code: string;
  balanceKwd: number;
  status: string;
};

export type CustomerWishlistItem = {
  id: string;
  productId: string;
  name: string;
  image: string;
  priceKwd: number;
  slug: string;
};

/**
 * Public-facing customer profile shape sent to the client.
 * Backed by the `Customer` Prisma model + relations.
 */
export type PublicCustomer = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  birthdayIso: string | null;
  referralCode: string;
  createdAtIso: string;
  loyaltyPoints: number;
  lifetimePoints: number;
  tier: LoyaltyTier;
  loyaltyEnabled: boolean;
  loyaltyEarnPercent: number;
  expiringPoints: number;
  minPointsToRedeem: number;
  redemptionPoints: number;
  redemptionValueKwd: number;
  loyaltyRedemptionCodes: CustomerLoyaltyCode[];
  storeCreditKwd: number;
  walletHistory: CustomerWalletTxn[];
  orders: CustomerOrderSummary[];
  addresses: CustomerAddress[];
  rewardsHistory: CustomerReward[];
  giftCards: CustomerGiftCard[];
  wishlist: CustomerWishlistItem[];
};

/** Legacy alias kept for existing callers */
export type CustomerOrder = CustomerOrderSummary;
