import type {
  Customer,
  CustomerAddress as DBAddress,
  GiftCard,
  LoyaltyTxn,
  Order,
  WishlistItem,
  Product,
} from "@prisma/client";
import type {
  CustomerAddress,
  CustomerGiftCard,
  CustomerLoyaltyCode,
  CustomerOrderSummary,
  CustomerReward,
  CustomerWalletTxn,
  CustomerWishlistItem,
  PublicCustomer,
} from "@/lib/customer-auth/types";
import type { LoyaltySettingsDTO } from "@/lib/loyalty-settings";
import { tierEarnPercent } from "@/lib/loyalty-settings";

type FullCustomer = Customer & {
  addresses?: DBAddress[];
  orders?: Order[];
  loyaltyTxns?: LoyaltyTxn[];
  giftCardsOwned?: GiftCard[];
  walletTxns?: import("@prisma/client").CustomerWalletTxn[];
  wishlist?: (WishlistItem & { product?: Product })[];
};

/** Map a DB customer row + relations into the client-safe shape. */
export function toPublicCustomer(
  c: FullCustomer,
  extras?: {
    loyaltySettings?: LoyaltySettingsDTO;
    expiringPoints?: number;
    redemptionCodes?: CustomerLoyaltyCode[];
  }
): PublicCustomer {
  const addresses: CustomerAddress[] =
    c.addresses?.map((a) => ({
      id: a.id,
      label: a.label,
      deliveryAreaId: a.area,
      street: a.street,
      building: a.building,
      block: a.block ?? "",
      city: a.city ?? "",
      houseNumber: a.houseNumber ?? "",
      floor: a.floor ?? "",
      doorNumber: a.doorNumber ?? "",
      additionalNotes: a.notes ?? "",
      latitude: a.latitude ?? null,
      longitude: a.longitude ?? null,
    })) ?? [];

  const orders: CustomerOrderSummary[] =
    c.orders
      ?.map((o) => ({
        id: o.id,
        dateIso: o.createdAt.toISOString(),
        totalKwd: Number(o.total),
        status: o.status,
        fulfillmentType: o.fulfillmentType,
      }))
      .sort((a, b) => b.dateIso.localeCompare(a.dateIso)) ?? [];

  const giftCards: CustomerGiftCard[] =
    c.giftCardsOwned
      ?.filter((g) => g.status === "ACTIVE" && Number(g.balance) > 0)
      .map((g) => ({
        id: g.id,
        code: g.code,
        balanceKwd: Number(g.balance),
        status: g.status,
      })) ?? [];

  const walletHistory: CustomerWalletTxn[] =
    c.walletTxns?.map((w) => ({
      id: w.id,
      dateIso: w.createdAt.toISOString(),
      type: w.type,
      amountKwd: Number(w.amount),
      balanceAfterKwd: Number(w.balanceAfter),
      reason: w.reason || w.type,
    })) ?? [];

  const rewardsHistory: CustomerReward[] =
    c.loyaltyTxns?.map((t) => ({
      id: t.id,
      dateIso: t.createdAt.toISOString(),
      points: t.points,
      description: t.reason || t.type,
      type: t.type,
      expiresAtIso: t.expiresAt?.toISOString() ?? null,
    })) ?? [];

  const wishlist: CustomerWishlistItem[] =
    c.wishlist
      ?.filter((w) => !!w.product)
      .map((w) => ({
        id: w.id,
        productId: w.productId,
        name: w.product!.name,
        image: w.product!.image,
        priceKwd: Number(w.product!.price),
        slug: w.product!.slug,
      })) ?? [];

  const settings = extras?.loyaltySettings;

  return {
    id: c.id,
    fullName: c.name,
    email: c.email,
    phone: c.phone,
    birthdayIso: c.birthday ? c.birthday.toISOString() : null,
    referralCode: c.referralCode,
    createdAtIso: c.createdAt.toISOString(),
    loyaltyPoints: c.loyaltyBalance,
    lifetimePoints: c.lifetimePoints,
    tier: c.tier,
    loyaltyEnabled: settings?.enabled ?? true,
    loyaltyEarnPercent: settings
      ? tierEarnPercent(c.tier, settings)
      : c.tier === "PLATINUM"
        ? 3
        : c.tier === "GOLD"
          ? 2.5
          : 2,
    expiringPoints: extras?.expiringPoints ?? 0,
    minPointsToRedeem: settings?.minPointsToRedeem ?? 100,
    redemptionPoints: settings?.redemptionPoints ?? 100,
    redemptionValueKwd: settings?.redemptionValueKwd ?? 0.5,
    loyaltyRedemptionCodes: extras?.redemptionCodes ?? [],
    storeCreditKwd: Number(c.storeCredit),
    walletHistory,
    orders,
    addresses,
    rewardsHistory,
    giftCards,
    wishlist,
  };
}
