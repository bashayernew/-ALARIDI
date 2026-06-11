"use client";

import { useI18n } from "@/components/i18n/i18n-provider";
import {
  formatGiftDeliverySummary,
  type GiftDeliveryDisplay,
  type GiftLineDelivery,
} from "@/lib/gift-delivery";

export function GiftDeliverySummaryLine({
  delivery,
}: {
  delivery: GiftLineDelivery | GiftDeliveryDisplay;
}) {
  const { locale } = useI18n();
  const text = formatGiftDeliverySummary(
    "receiverName" in delivery
      ? {
          fulfillmentType: delivery.fulfillmentType,
          recipientName: delivery.receiverName,
          receiverPhone: delivery.receiverPhone,
          receiverAddress: delivery.receiverAddress,
          pickupBranch: delivery.pickupBranch,
          deliveryDate: delivery.deliveryDate,
          deliveryTimeSlot: delivery.deliveryTimeSlot,
          deliveryNotes: delivery.deliveryNotes,
        }
      : delivery,
    locale
  );
  if (!text) return null;
  return (
    <p className="mt-1 text-[11px] leading-snug text-primary/80">{text}</p>
  );
}
