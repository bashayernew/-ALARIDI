import type { Locale } from "@/lib/i18n";
import { formatKwd } from "@/lib/format";
import {
  formatGiftDeliverySummary,
  pickupBranchLabel,
  type GiftLineDelivery,
} from "@/lib/gift-delivery";
import { DEFAULT_SOCIAL_URLS } from "@/lib/site-content-types";

export type GiftBasketOrderItem = {
  name: string;
  quantity: number;
  unitPriceKwd: number;
};

export type GiftBasketOrderSummary = {
  title: string;
  items: GiftBasketOrderItem[];
  itemsTotalKwd: number;
  wrapTotalKwd?: number;
  totalKwd: number;
  cardMessage?: string;
  delivery: GiftLineDelivery;
};

function whatsappPhoneFromUrl(url: string): string {
  const match = url.match(/wa\.me\/(\d+)/);
  return match?.[1] ?? "96590090892";
}

export function buildGiftBasketWhatsAppMessage(
  summary: GiftBasketOrderSummary,
  locale: Locale
): string {
  const lines: string[] = [];
  lines.push(
    locale === "ar"
      ? "🎁 *طلب سلة هدايا — حلويات العريضي*"
      : "🎁 *Gift Basket Order — Al Aridi Sweets*"
  );
  lines.push("");
  lines.push(
    locale === "ar" ? `*السلة:* ${summary.title}` : `*Basket:* ${summary.title}`
  );
  lines.push("");
  lines.push(locale === "ar" ? "*المنتجات:*" : "*Items:*");
  for (const item of summary.items) {
    lines.push(
      `• ${item.quantity}× ${item.name} — ${formatKwd(item.unitPriceKwd * item.quantity)}`
    );
  }
  if (summary.wrapTotalKwd != null && summary.wrapTotalKwd > 0) {
    lines.push(
      locale === "ar"
        ? `• ${formatKwd(summary.wrapTotalKwd)} — ${"تغليف هدايا"}`
        : `• Gift wrap — ${formatKwd(summary.wrapTotalKwd)}`
    );
  }
  lines.push("");
  lines.push(
    locale === "ar"
      ? `*الإجمالي:* ${formatKwd(summary.totalKwd)}`
      : `*Total:* ${formatKwd(summary.totalKwd)}`
  );
  lines.push("");
  lines.push(locale === "ar" ? "*المستلم:*" : "*Receiver:*");
  lines.push(summary.delivery.receiverName);
  lines.push(summary.delivery.receiverPhone);

  if (summary.delivery.fulfillmentType === "DELIVERY") {
    lines.push(
      locale === "ar"
        ? `*التوصيل:* ${summary.delivery.receiverAddress ?? ""}`
        : `*Delivery address:* ${summary.delivery.receiverAddress ?? ""}`
    );
  } else {
    lines.push(
      locale === "ar" ? "*الاستلام:*" : "*Pickup:*",
      pickupBranchLabel(summary.delivery.pickupBranch ?? "", locale)
    );
  }

  const dateLabel =
    summary.delivery.deliveryDate &&
    new Date(`${summary.delivery.deliveryDate}T12:00:00`).toLocaleDateString(
      locale === "ar" ? "ar-KW" : "en-KW"
    );
  if (dateLabel) {
    lines.push(
      locale === "ar"
        ? `*التاريخ:* ${dateLabel}`
        : `*Date:* ${dateLabel}`
    );
  }
  if (summary.delivery.deliveryTimeSlot) {
    lines.push(
      locale === "ar"
        ? `*الوقت:* ${summary.delivery.deliveryTimeSlot}`
        : `*Time:* ${summary.delivery.deliveryTimeSlot}`
    );
  }
  if (summary.delivery.deliveryNotes?.trim()) {
    lines.push(
      locale === "ar"
        ? `*ملاحظات:* ${summary.delivery.deliveryNotes.trim()}`
        : `*Notes:* ${summary.delivery.deliveryNotes.trim()}`
    );
  }
  if (summary.cardMessage?.trim()) {
    lines.push(
      locale === "ar"
        ? `*رسالة البطاقة:* ${summary.cardMessage.trim()}`
        : `*Card message:* ${summary.cardMessage.trim()}`
    );
  }

  return lines.join("\n");
}

export function buildGiftBasketWhatsAppUrl(
  summary: GiftBasketOrderSummary,
  locale: Locale,
  whatsappBaseUrl: string = DEFAULT_SOCIAL_URLS.whatsapp
): string {
  const phone = whatsappPhoneFromUrl(whatsappBaseUrl);
  const text = buildGiftBasketWhatsAppMessage(summary, locale);
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function formatGiftBasketOrderSummaryDelivery(
  delivery: GiftLineDelivery,
  locale: Locale
): string {
  return formatGiftDeliverySummary(
    {
      fulfillmentType: delivery.fulfillmentType,
      recipientName: delivery.receiverName,
      receiverPhone: delivery.receiverPhone,
      receiverAddress: delivery.receiverAddress,
      pickupBranch: delivery.pickupBranch,
      deliveryDate: delivery.deliveryDate,
      deliveryTimeSlot: delivery.deliveryTimeSlot,
      deliveryNotes: delivery.deliveryNotes,
    },
    locale
  );
}
