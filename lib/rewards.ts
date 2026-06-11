export type RewardTrigger = "points-redemption" | "ten-orders" | "seasonal-campaign";
export type RewardType = "discount-voucher" | "free-product" | "free-delivery" | "exclusive-bundle";

export type RewardRule = {
  id: string;
  trigger: RewardTrigger;
  reward: RewardType;
  pointsCost?: number;
};

export const REWARD_RULES: RewardRule[] = [
  { id: "voucher-1000", trigger: "points-redemption", reward: "discount-voucher", pointsCost: 1000 },
  { id: "delivery-500", trigger: "points-redemption", reward: "free-delivery", pointsCost: 500 },
  { id: "milestone-10", trigger: "ten-orders", reward: "free-product" },
  { id: "seasonal-eid", trigger: "seasonal-campaign", reward: "exclusive-bundle" },
];
