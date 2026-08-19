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

/** Cash on delivery is paid at the end — so PAID comes after DELIVERED. */
const STATUS_ORDER_COD: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.PREPARING,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
  OrderStatus.PAID,
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
  const statusOptions =
    order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
      ? STATUS_ORDER_COD
      : STATUS_ORDER;

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
  const deliveries = order.items.filter((i) => i.deliverySummary);

  return (
    <div className="rounded-2xl border border-border bg-card/50 p-4 shadow-sm transition-colors hover:bg-muted/10 sm:p-5">
      {/* Header: id + type + date, with the status control on the right */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              #{order.id.slice(0, 8)}
            </span>
            <span
              className={
                account
                  ? "rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[11px] text-emerald-600 dark:text-emerald-300"
                  : "rounded-md bg-muted/40 px-1.5 py-0.5 text-[11px] text-muted-foreground"
              }
            >
              {account
                ? t("admin.orders.accountOrder")
                : t("admin.orders.guestOrder")}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="shrink-0">
          <Select value={order.status} onValueChange={onChange}>
            <SelectTrigger
              size="sm"
              className="w-[150px] border-border bg-card text-foreground"
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
        </div>
      </div>

      {/* Customer + address + total */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1.4fr_auto]">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("admin.dashboard.th.customer")}
          </p>
          <p className="mt-0.5 truncate font-medium text-foreground">
            {order.customerName}
          </p>
          <p className="text-xs text-muted-foreground">{order.phone}</p>
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("admin.orders.th.address")}
          </p>
          {order.fulfillmentType === FulfillmentType.PICKUP &&
          order.pickupBranchName ? (
            <p className="mt-0.5 text-xs font-medium text-foreground">
              {t("admin.orders.pickupBranch")}: {order.pickupBranchName}
            </p>
          ) : null}
          <p className="mt-0.5 whitespace-pre-wrap break-words text-xs text-muted-foreground">
            {order.address}
          </p>
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
        </div>

        <div className="sm:text-end">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("admin.dashboard.th.total")}
          </p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
            {formatKwd(total)}
          </p>
        </div>
      </div>

      {/* Items — compact wrapping chips instead of a tall stacked column */}
      <div className="mt-4 border-t border-border/60 pt-3">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("admin.orders.th.items")}
        </p>
        {order.items.length ? (
          <div className="flex flex-wrap gap-1.5">
            {order.items.map((item, idx) => (
              <span
                key={`${item.name}-${idx}`}
                className="inline-flex items-center rounded-md bg-muted/40 px-2 py-0.5 text-xs text-foreground"
              >
                <span className="tabular-nums text-muted-foreground">
                  {item.quantity}×
                </span>
                <span className="ms-1">{item.name}</span>
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
        {deliveries.length ? (
          <div className="mt-2 space-y-0.5">
            {deliveries.map((item, idx) => (
              <p
                key={`d-${idx}`}
                className="text-[11px] leading-snug text-primary/80"
              >
                {item.name}: {item.deliverySummary}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
