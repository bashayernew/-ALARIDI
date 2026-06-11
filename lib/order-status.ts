import { FulfillmentType, OrderStatus } from "@prisma/client";
import type { TranslationKey } from "@/lib/dictionary";

/**
 * Translation key for an order status, adapted to the fulfillment type.
 * Pickup orders relabel the shipping stages: OUT_FOR_DELIVERY → "Ready for
 * pickup" and DELIVERED → "Picked up". Delivery orders keep the shipping
 * wording. The same admin status enum drives both, so customers see the
 * progress the admin marks.
 */
export function orderStatusLabelKey(
  status: OrderStatus,
  fulfillment: FulfillmentType | string | null | undefined
): TranslationKey {
  const isPickup = fulfillment === FulfillmentType.PICKUP;
  switch (status) {
    case OrderStatus.PENDING:
      return "admin.orderStatus.pending";
    case OrderStatus.PAID:
      return "admin.orderStatus.paid";
    case OrderStatus.PREPARING:
      return "admin.orderStatus.preparing";
    case OrderStatus.OUT_FOR_DELIVERY:
      return isPickup
        ? "admin.orderStatus.readyForPickup"
        : "admin.orderStatus.outForDelivery";
    case OrderStatus.DELIVERED:
      return isPickup
        ? "admin.orderStatus.pickedUp"
        : "admin.orderStatus.delivered";
    case OrderStatus.CANCELLED:
      return "admin.orderStatus.cancelled";
    default:
      return "admin.orderStatus.pending";
  }
}
