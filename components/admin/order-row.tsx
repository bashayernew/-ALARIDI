"use client";

import { FulfillmentType, OrderStatus, PaymentMethod } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateOrderStatus } from "@/actions/orders-admin";
import { formatKwd } from "@/lib/format";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import type { Locale } from "@/lib/i18n";
import { translate, type TranslationKey } from "@/lib/dictionary";
import { orderStatusLabelKey } from "@/lib/order-status";

const STATUS_ORDER: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.PAID,
  OrderStatus.PREPARING,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
];

type Props = {
  locale: Locale;
  order: {
    id: string;
    customerName: string;
    phone: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    fulfillmentType: FulfillmentType;
    pickupBranchName: string | null;
    customerUserId: string | null;
    total: number;
    status: OrderStatus;
    paymentMethod: PaymentMethod | null;
    createdAt: Date;
    items: { quantity: number; name: string; deliverySummary?: string }[];
  };
};

export function OrderRow({ locale, order }: Props) {
  const total = order.total;
  const t = (key: TranslationKey) => translate(locale, key);

  // Payments are handled manually until a payment gateway is integrated, so the
  // admin keeps full manual control over every order status (Pending → Paid →
  // Preparing → Out for delivery → Delivered, or Cancelled). Once a gateway is
  // wired up, gateway orders can again be auto-marked Paid.
  const statusOptions = STATUS_ORDER;

  async function onChange(v: string | null) {
    if (!v) return;
    try {
      await updateOrderStatus(order.id, v as OrderStatus);
      toast.success(t("admin.orderRow.toastSuccess"));
    } catch {
      toast.error(t("admin.orderRow.toastError"));
    }
  }

  const account = Boolean(order.customerUserId);

  return (
    <tr className="border-b border-border text-sm transition-colors hover:bg-muted/20">
      <td className="px-4 py-3 align-top font-mono text-xs text-muted-foreground">
        {order.id.slice(0, 8)}…
      </td>
      <td className="px-4 py-3 align-top">
        <span
          className={
            account
              ? "inline-block whitespace-nowrap rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[11px] text-emerald-600 dark:text-emerald-300"
              : "inline-block whitespace-nowrap rounded-md bg-muted/30 px-1.5 py-0.5 text-[11px] text-muted-foreground"
          }
        >
          {account ? t("admin.orders.accountOrder") : t("admin.orders.guestOrder")}
        </span>
      </td>
      <td className="px-4 py-3 align-top">
        <div className="font-medium text-foreground">{order.customerName}</div>
        <div className="whitespace-nowrap text-xs text-muted-foreground">
          {order.phone}
        </div>
      </td>
      <td className="min-w-[200px] max-w-[280px] px-4 py-3 align-top text-xs text-muted-foreground">
        {order.fulfillmentType === FulfillmentType.PICKUP &&
        order.pickupBranchName ? (
          <div className="mb-1 font-medium text-foreground">
            {t("admin.orders.pickupBranch")}: {order.pickupBranchName}
          </div>
        ) : null}
        <span className="block whitespace-pre-wrap break-words">
          {order.address}
        </span>
        {order.latitude != null && order.longitude != null ? (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
          >
            <MapPin className="size-3" />
            {t("admin.orders.viewOnMap")}
          </a>
        ) : null}
      </td>
      <td className="max-w-[280px] px-4 py-3 align-top text-xs text-muted-foreground">
        {order.items.length ? (
          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div key={`${item.name}-${idx}`}>
                <p>
                  {item.quantity}× {item.name}
                </p>
                {item.deliverySummary ? (
                  <p className="mt-0.5 text-[11px] leading-snug text-primary/80">
                    {item.deliverySummary}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          "—"
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-3 align-top tabular-nums font-medium text-foreground">
        {formatKwd(total)}
      </td>
      <td className="whitespace-nowrap px-4 py-3 align-top text-xs text-muted-foreground">
        {new Date(order.createdAt).toLocaleString()}
      </td>
      <td className="px-4 py-3 align-top">
        <Select value={order.status} onValueChange={onChange}>
          <SelectTrigger
            size="sm"
            className="w-[160px] border-border bg-card text-foreground"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((s) => (
              <SelectItem key={s} value={s}>
                {t(orderStatusLabelKey(s, order.fulfillmentType))}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
    </tr>
  );
}
