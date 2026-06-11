import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getLocale } from "@/lib/i18n-server";
import { translate, type TranslationKey } from "@/lib/dictionary";
import { prisma } from "@/lib/prisma";
import { dbQuery } from "@/lib/db-safe";
import { getCurrentCustomerId } from "@/lib/customer-auth/server";
import { formatKwd } from "@/lib/format";
import { OrderStatus } from "@prisma/client";
import { formatGiftDeliverySummary } from "@/lib/gift-delivery";
import { orderStatusLabelKey } from "@/lib/order-status";

export const dynamic = "force-dynamic";

type Params = { id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const locale = await getLocale();
  return {
    title: `${translate(locale, "orders.meta.title")} · ${id.slice(0, 8)}`,
  };
}

const STATUS_FLOW: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.PAID,
  OrderStatus.PREPARING,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
];

const FULFILLMENT_LABEL: Record<string, TranslationKey> = {
  DELIVERY: "checkout.fulfillment.delivery",
  PICKUP: "checkout.fulfillment.pickup",
  SCHEDULED: "checkout.fulfillment.scheduled",
};

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const locale = await getLocale();
  const t = (key: TranslationKey, vars?: Record<string, string | number>) =>
    translate(locale, key, vars);

  const order = await dbQuery(null, () =>
    prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        giftCardItems: { include: { giftCardProduct: true } },
        giftBasketItems: { include: { giftBasket: true } },
      },
    })
  );

  if (!order) notFound();

  // Access control: customers can only see their own; guests can only see
  // their order via the confirmation link (which doesn't enforce auth).
  const me = await getCurrentCustomerId();
  if (order.customerUserId && me && order.customerUserId !== me) {
    // Show a polite "not yours" rather than 404
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-heading text-2xl">{t("orders.notYours.title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("orders.notYours.body")}</p>
        <Link href="/account" className="mt-6 inline-block text-primary hover:underline">
          {t("orders.notYours.cta")}
        </Link>
      </div>
    );
  }

  const currentIdx =
    order.status === OrderStatus.CANCELLED
      ? -1
      : STATUS_FLOW.indexOf(order.status);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12 sm:px-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          {t("orders.tracking.kicker")}
        </p>
        <h1 className="mt-2 font-heading text-3xl">
          {t("orders.tracking.title")} #{order.id.slice(0, 8)}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {new Date(order.createdAt).toLocaleString(
            locale === "ar" ? "ar-KW" : "en-KW"
          )}
        </p>
      </header>

      {/* Status timeline */}
      <section className="rounded-2xl border border-border/60 bg-card/40 p-6">
        <h2 className="font-heading text-xl">{t("orders.tracking.status")}</h2>
        {order.status === OrderStatus.CANCELLED ? (
          <p className="mt-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {t(orderStatusLabelKey(OrderStatus.CANCELLED, order.fulfillmentType))}
          </p>
        ) : (
          <ol className="mt-6 space-y-4">
            {STATUS_FLOW.map((s, i) => {
              const done = i <= currentIdx;
              const current = i === currentIdx;
              return (
                <li
                  key={s}
                  className="flex items-center gap-3"
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${
                      done
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground"
                    } ${current ? "ring-2 ring-primary/40" : ""}`}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={
                      done ? "font-medium" : "text-muted-foreground"
                    }
                  >
                    {t(orderStatusLabelKey(s, order.fulfillmentType))}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* Delivery info */}
      <section className="rounded-2xl border border-border/60 bg-card/40 p-6">
        <h2 className="font-heading text-xl">{t("orders.tracking.delivery")}</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase text-muted-foreground">
              {t("orders.field.name")}
            </dt>
            <dd>{order.customerName}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-muted-foreground">
              {t("orders.field.phone")}
            </dt>
            <dd>{order.phone}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase text-muted-foreground">
              {t("orders.field.address")}
            </dt>
            <dd>{order.address}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-muted-foreground">
              {t("orders.field.fulfillment")}
            </dt>
            <dd>
              {FULFILLMENT_LABEL[order.fulfillmentType]
                ? t(FULFILLMENT_LABEL[order.fulfillmentType])
                : order.fulfillmentType}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-muted-foreground">
              {t("orders.field.slot")}
            </dt>
            <dd>{order.deliverySlot}</dd>
          </div>
          {order.scheduledDate && (
            <div>
              <dt className="text-xs uppercase text-muted-foreground">
                {t("orders.field.scheduledDate")}
              </dt>
              <dd>
                {new Date(order.scheduledDate).toLocaleDateString(
                  locale === "ar" ? "ar-KW" : "en-KW"
                )}
              </dd>
            </div>
          )}
          {order.paymentMethod && (
            <div>
              <dt className="text-xs uppercase text-muted-foreground">
                {t("orders.field.payment")}
              </dt>
              <dd>{order.paymentMethod}</dd>
            </div>
          )}
        </dl>
      </section>

      {/* Items */}
      <section className="rounded-2xl border border-border/60 bg-card/40 p-6">
        <h2 className="font-heading text-xl">{t("orders.tracking.items")}</h2>
        <ul className="mt-4 space-y-3">
          {order.items.map((it) => {
            const itemName =
              locale === "ar" && it.product.nameAr
                ? it.product.nameAr
                : it.product.name;
            const deliveryText = formatGiftDeliverySummary(
              {
                fulfillmentType: it.giftFulfillmentType,
                recipientName: it.recipientName,
                receiverPhone: it.receiverPhone,
                receiverAddress: it.receiverAddress,
                pickupBranch: it.pickupBranch,
                deliveryDate: it.deliveryDate,
                deliveryTimeSlot: it.deliveryTimeSlot,
                deliveryNotes: it.deliveryNotes,
              },
              locale
            );
            return (
              <li key={it.id} className="flex items-start gap-3 text-sm">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={it.product.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{itemName}</p>
                  <p className="text-xs text-muted-foreground">
                    ×{it.quantity} · {formatKwd(Number(it.unitPrice))}
                  </p>
                  {it.note && (
                    <p className="mt-1 text-xs text-muted-foreground">{it.note}</p>
                  )}
                  {deliveryText ? (
                    <p className="mt-1 text-[11px] text-primary/80">{deliveryText}</p>
                  ) : null}
                </div>
                <span className="font-medium tabular-nums">
                  {formatKwd(Number(it.lineTotal))}
                </span>
              </li>
            );
          })}
          {order.giftBasketItems.map((it) => {
            const itemName =
              locale === "ar" && it.giftBasket.nameAr.trim()
                ? it.giftBasket.nameAr
                : it.giftBasket.nameEn;
            const deliveryText = formatGiftDeliverySummary(
              {
                fulfillmentType: it.giftFulfillmentType,
                recipientName: it.recipientName,
                receiverPhone: it.receiverPhone,
                receiverAddress: it.receiverAddress,
                pickupBranch: it.pickupBranch,
                deliveryDate: it.deliveryDate,
                deliveryTimeSlot: it.deliveryTimeSlot,
                deliveryNotes: it.deliveryNotes,
              },
              locale
            );
            return (
              <li key={it.id} className="flex items-start gap-3 text-sm">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={it.giftBasket.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {t("cart.giftBasketLine")}: {itemName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ×{it.quantity} · {formatKwd(Number(it.unitPrice))}
                  </p>
                  {it.recipientName && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {it.recipientName}
                    </p>
                  )}
                  {it.cardMessage && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {it.cardMessage}
                    </p>
                  )}
                  {deliveryText ? (
                    <p className="mt-1 text-[11px] text-primary/80">{deliveryText}</p>
                  ) : null}
                </div>
                <span className="font-medium tabular-nums">
                  {formatKwd(Number(it.lineTotal))}
                </span>
              </li>
            );
          })}
          {order.giftCardItems.map((it) => {
            const itemName =
              locale === "ar" && it.giftCardProduct.titleAr.trim()
                ? it.giftCardProduct.titleAr
                : it.giftCardProduct.titleEn;
            const deliveryText = formatGiftDeliverySummary(
              {
                fulfillmentType: it.giftFulfillmentType,
                recipientName: it.recipientName,
                receiverPhone: it.receiverPhone,
                receiverAddress: it.receiverAddress,
                pickupBranch: it.pickupBranch,
                deliveryDate: it.deliveryDate,
                deliveryTimeSlot: it.deliveryTimeSlot,
                deliveryNotes: it.deliveryNotes,
              },
              locale
            );
            return (
              <li key={it.id} className="flex items-start gap-3 text-sm">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={it.giftCardProduct.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{itemName}</p>
                  <p className="text-xs text-muted-foreground">
                    ×{it.quantity} · {formatKwd(Number(it.unitPrice))}
                  </p>
                  {it.recipientName && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {it.recipientName}
                    </p>
                  )}
                  {deliveryText ? (
                    <p className="mt-1 text-[11px] text-primary/80">{deliveryText}</p>
                  ) : null}
                </div>
                <span className="font-medium tabular-nums">
                  {formatKwd(Number(it.lineTotal))}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-6 space-y-1 border-t border-border/60 pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {t("orders.totals.subtotal")}
            </span>
            <span className="tabular-nums">
              {formatKwd(Number(order.subtotal))}
            </span>
          </div>
          {Number(order.discountAmount) > 0 && (
            <div className="flex justify-between text-primary">
              <span>{t("orders.totals.discount")}</span>
              <span className="tabular-nums">
                −{formatKwd(Number(order.discountAmount))}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {t("orders.totals.delivery")}
            </span>
            <span className="tabular-nums">
              {formatKwd(Number(order.deliveryFee))}
            </span>
          </div>
          {Number(order.giftCardApplied) > 0 && (
            <div className="flex justify-between text-primary">
              <span>{t("orders.totals.giftCard")}</span>
              <span className="tabular-nums">
                −{formatKwd(Number(order.giftCardApplied))}
              </span>
            </div>
          )}
          {order.pointsRedeemed > 0 && (
            <div className="flex justify-between text-primary">
              <span>{t("orders.totals.points")}</span>
              <span className="tabular-nums">
                −{order.pointsRedeemed} pts
              </span>
            </div>
          )}
          <div className="flex justify-between border-t border-border/60 pt-2 font-heading text-lg text-primary">
            <span>{t("orders.totals.total")}</span>
            <span className="tabular-nums">
              {formatKwd(Number(order.total))}
            </span>
          </div>
          {order.pointsEarned > 0 && (
            <p className="mt-2 text-xs text-primary">
              {t("orders.totals.earned", { points: order.pointsEarned })}
            </p>
          )}
        </div>
      </section>

      <p className="text-center text-sm text-muted-foreground">
        {t("orders.tracking.support")}
        <Link href="/contact" className="ms-1 text-primary hover:underline">
          {t("orders.tracking.contactCta")}
        </Link>
      </p>
    </div>
  );
}
