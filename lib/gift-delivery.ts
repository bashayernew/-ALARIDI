import type { Locale } from "@/lib/i18n";
import { FulfillmentType } from "@prisma/client";
import { DELIVERY_TIME_SLOTS } from "@/lib/checkout-constants";
import {
  FALLBACK_PICKUP_BRANCHES,
  pickupBranchDisplayLabel,
  type PickupBranchOption,
} from "@/lib/pickup-branch";

export type GiftFulfillmentType = "DELIVERY" | "PICKUP";

export type GiftLineDelivery = {
  fulfillmentType: GiftFulfillmentType;
  receiverName: string;
  receiverPhone: string;
  receiverAddress?: string;
  pickupBranch?: string;
  deliveryDate: string;
  deliveryTimeSlot: string;
  deliveryNotes?: string;
};

/** @deprecated Use FALLBACK_PICKUP_BRANCHES — kept for imports. */
export const PICKUP_BRANCHES = FALLBACK_PICKUP_BRANCHES.map((b) => ({
  id: b.id,
  labelEn: b.nameEn,
  labelAr: b.nameAr,
}));

export function pickupBranchLabel(
  id: string,
  locale: Locale,
  branches?: PickupBranchOption[]
): string {
  return pickupBranchDisplayLabel(id, locale, branches ?? FALLBACK_PICKUP_BRANCHES);
}

export function emptyGiftDelivery(defaultPickupBranchId?: string): GiftLineDelivery {
  const defaultId =
    defaultPickupBranchId ?? FALLBACK_PICKUP_BRANCHES[0]!.id;
  return {
    fulfillmentType: "DELIVERY",
    receiverName: "",
    receiverPhone: "",
    receiverAddress: "",
    pickupBranch: defaultId,
    deliveryDate: "",
    deliveryTimeSlot: DELIVERY_TIME_SLOTS[0]!,
    deliveryNotes: "",
  };
}

export function giftDeliveryKey(d?: GiftLineDelivery): string {
  if (!d) return "";
  return [
    d.fulfillmentType,
    d.receiverName.trim(),
    d.receiverPhone.trim(),
    d.receiverAddress?.trim() ?? "",
    d.pickupBranch ?? "",
    d.deliveryDate,
    d.deliveryTimeSlot,
    d.deliveryNotes?.trim() ?? "",
  ].join("|");
}

type ValidateMessages = {
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  pickupBranch: string;
  deliveryDate: string;
  deliveryTimeSlot: string;
};

export function validateGiftDelivery(
  d: GiftLineDelivery,
  messages: ValidateMessages
): string | null {
  if (!d.receiverName.trim()) return messages.receiverName;
  if (!d.receiverPhone.trim()) return messages.receiverPhone;
  if (d.fulfillmentType === "DELIVERY") {
    if (!d.receiverAddress?.trim()) return messages.receiverAddress;
  } else if (!d.pickupBranch?.trim()) {
    return messages.pickupBranch;
  }
  if (!d.deliveryDate.trim()) return messages.deliveryDate;
  if (!d.deliveryTimeSlot.trim()) return messages.deliveryTimeSlot;
  const picked = new Date(`${d.deliveryDate}T12:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (Number.isNaN(picked.getTime()) || picked < today) {
    return messages.deliveryDate;
  }
  return null;
}

export type GiftDeliveryDisplay = {
  fulfillmentType?: GiftFulfillmentType | FulfillmentType | null;
  recipientName?: string | null;
  receiverPhone?: string | null;
  receiverAddress?: string | null;
  pickupBranch?: string | null;
  deliveryDate?: Date | string | null;
  deliveryTimeSlot?: string | null;
  deliveryNotes?: string | null;
};

function normalizeGiftFulfillment(
  ft: GiftFulfillmentType | FulfillmentType | null | undefined
): GiftFulfillmentType | null {
  if (ft == null) return null;
  const s = String(ft);
  if (s === "PICKUP") return "PICKUP";
  if (s === "DELIVERY" || s === "SCHEDULED") return "DELIVERY";
  return null;
}

export function formatGiftDeliverySummary(
  row: GiftDeliveryDisplay,
  locale: Locale
): string {
  const parts: string[] = [];
  const name = row.recipientName?.trim();
  if (name) parts.push(name);
  if (row.receiverPhone?.trim()) parts.push(row.receiverPhone.trim());

  const ft = normalizeGiftFulfillment(row.fulfillmentType);
  if (ft === "PICKUP") {
    parts.push(
      locale === "ar" ? "استلام" : "Pickup",
      row.pickupBranch
        ? pickupBranchLabel(row.pickupBranch, locale, undefined)
        : locale === "ar"
          ? "فرع"
          : "Branch"
    );
  } else if (ft === "DELIVERY") {
    parts.push(locale === "ar" ? "توصيل" : "Delivery");
    if (row.receiverAddress?.trim()) parts.push(row.receiverAddress.trim());
  }

  if (row.deliveryDate) {
    const d =
      row.deliveryDate instanceof Date
        ? row.deliveryDate
        : new Date(row.deliveryDate);
    if (!Number.isNaN(d.getTime())) {
      parts.push(
        d.toLocaleDateString(locale === "ar" ? "ar-KW" : "en-KW")
      );
    }
  }
  if (row.deliveryTimeSlot?.trim()) parts.push(row.deliveryTimeSlot.trim());
  if (row.deliveryNotes?.trim()) parts.push(row.deliveryNotes.trim());

  return parts.filter(Boolean).join(" · ");
}

export function giftDeliveryToOrderFields(line: {
  recipientName?: string;
  giftDelivery?: GiftLineDelivery;
}) {
  const d = line.giftDelivery;
  if (!d) {
    return {
      giftFulfillmentType: null as FulfillmentType | null,
      recipientName: line.recipientName?.trim() || null,
      receiverPhone: null as string | null,
      receiverAddress: null as string | null,
      pickupBranch: null as string | null,
      deliveryDate: null as Date | null,
      deliveryTimeSlot: null as string | null,
      deliveryNotes: null as string | null,
    };
  }
  return {
    giftFulfillmentType: d.fulfillmentType as FulfillmentType,
    recipientName: d.receiverName.trim() || line.recipientName?.trim() || null,
    receiverPhone: d.receiverPhone.trim() || null,
    receiverAddress:
      d.fulfillmentType === "DELIVERY" ? d.receiverAddress?.trim() || null : null,
    pickupBranch:
      d.fulfillmentType === "PICKUP" ? d.pickupBranch?.trim() || null : null,
    deliveryDate: d.deliveryDate
      ? new Date(`${d.deliveryDate}T12:00:00`)
      : null,
    deliveryTimeSlot: d.deliveryTimeSlot || null,
    deliveryNotes: d.deliveryNotes?.trim() || null,
  };
}

export { DELIVERY_TIME_SLOTS };
