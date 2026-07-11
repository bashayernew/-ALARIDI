"use client";

import * as React from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatKwd } from "@/lib/format";
import { GIFT_WRAP_FEE_KWD, MIN_GIFT_BASKET_KWD } from "@/lib/pricing";
import { useI18n } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";
import type { BuilderProductDTO } from "@/lib/gift-baskets";
import { GiftDeliveryFields } from "@/components/gifts/gift-delivery-fields";
import { GiftBasketSummaryDialog } from "@/components/gifts/gift-basket-summary-dialog";
import {
  emptyGiftDelivery,
  validateGiftDelivery,
  type GiftLineDelivery,
} from "@/lib/gift-delivery";
import type { GiftBasketOrderSummary } from "@/lib/gift-basket-order";
import type { PickupBranchOption } from "@/lib/pickup-branch";

type Selection = { product: BuilderProductDTO; quantity: number };

/** Product thumbnail with a gradient + initials fallback when the image fails. */
function BuilderThumb({ src, name }: { src: string; name: string }) {
  const [err, setErr] = React.useState(false);
  if (err || !src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent via-card to-background text-[10px] font-semibold uppercase text-primary/80">
        {name.slice(0, 2)}
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt=""
      fill
      className="object-cover"
      sizes="64px"
      onError={() => setErr(true)}
      unoptimized
    />
  );
}

export function GiftBundleBuilder({
  products,
  pickupBranches,
}: {
  products: BuilderProductDTO[];
  pickupBranches: PickupBranchOption[];
}) {
  const { t } = useI18n();
  const defaultPickupBranchId = pickupBranches[0]?.id ?? "";
  const [selected, setSelected] = React.useState<Record<string, number>>({});
  const [cardMessage, setCardMessage] = React.useState("");
  const [delivery, setDelivery] = React.useState<GiftLineDelivery>(() =>
    emptyGiftDelivery(defaultPickupBranchId)
  );
  const [summaryOpen, setSummaryOpen] = React.useState(false);
  const [summary, setSummary] = React.useState<GiftBasketOrderSummary | null>(null);
  const [building, setBuilding] = React.useState(false);

  const selections: Selection[] = products
    .map((p) => ({ product: p, quantity: selected[p.id] ?? 0 }))
    .filter((s) => s.quantity > 0);

  const itemsTotal = selections.reduce(
    (sum, s) => sum + s.product.priceKwd * s.quantity,
    0
  );
  const wrapTotal = GIFT_WRAP_FEE_KWD * selections.reduce(
    (n, s) => n + s.quantity,
    0
  );
  const bundleTotal = itemsTotal + wrapTotal;
  const totalItems = selections.reduce((n, s) => n + s.quantity, 0);
  const remainingKwd = Math.max(0, MIN_GIFT_BASKET_KWD - itemsTotal);
  const minReached = remainingKwd <= 0;

  function bump(id: string, delta: number) {
    setSelected((cur) => {
      const next = { ...cur };
      const v = (next[id] ?? 0) + delta;
      if (v <= 0) {
        delete next[id];
      } else {
        next[id] = v;
      }
      return next;
    });
  }

  function reviewBasket() {
    if (selections.length === 0) {
      toast.error(t("gifts.builder.empty"));
      return;
    }
    if (!minReached) {
      toast.error(t("gifts.builder.minError"));
      return;
    }
    const deliveryError = validateGiftDelivery(delivery, {
      receiverName: t("gifts.delivery.error.receiverName"),
      receiverPhone: t("gifts.delivery.error.receiverPhone"),
      receiverAddress: t("gifts.delivery.error.receiverAddress"),
      pickupBranch: t("gifts.delivery.error.pickupBranch"),
      deliveryDate: t("gifts.delivery.error.deliveryDate"),
      deliveryTimeSlot: t("gifts.delivery.error.timeSlot"),
    });
    if (deliveryError) {
      toast.error(deliveryError);
      return;
    }

    const deliveryPayload = {
      ...delivery,
      receiverName: delivery.receiverName.trim(),
      receiverPhone: delivery.receiverPhone.trim(),
      receiverAddress: delivery.receiverAddress?.trim(),
      deliveryNotes: delivery.deliveryNotes?.trim(),
    };

    setSummary({
      title: t("gifts.builder.customBasketTitle"),
      items: selections.map((s) => ({
        name: s.product.name,
        quantity: s.quantity,
        unitPriceKwd: s.product.priceKwd,
      })),
      itemsTotalKwd: itemsTotal,
      wrapTotalKwd: wrapTotal,
      totalKwd: bundleTotal,
      cardMessage: cardMessage.trim() || undefined,
      delivery: deliveryPayload,
    });
    setSummaryOpen(true);
  }

  function resetForm() {
    setSelected({});
    setCardMessage("");
    setDelivery(emptyGiftDelivery(defaultPickupBranchId));
    setSummary(null);
  }

  if (!building) {
    return (
      <div className="rounded-3xl border border-primary/30 bg-secondary/15 p-6 text-center sm:p-8">
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          {t("gifts.createOwn.prompt")}
        </p>
        <Button
          type="button"
          className="mt-4 gap-2 rounded-xl"
          onClick={() => setBuilding(true)}
        >
          <Gift className="size-4" />
          {t("gifts.createOwn.start")}
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {t("gifts.builder.chooseItems")}
          </p>
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("gifts.builder.noProducts")}
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {products.map((p) => {
                const qty = selected[p.id] ?? 0;
                return (
                  <li
                    key={p.id}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border bg-card/40 p-3 transition",
                      qty > 0
                        ? "border-primary/40 ring-1 ring-primary/30"
                        : "border-border/60"
                    )}
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <BuilderThumb src={p.image} name={p.name} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-snug">{p.name}</p>
                      <p className="text-xs tabular-nums text-muted-foreground">
                        {formatKwd(p.priceKwd)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="outline"
                        disabled={qty === 0}
                        onClick={() => bump(p.id, -1)}
                      >
                        −
                      </Button>
                      <span className="w-6 text-center text-sm tabular-nums">
                        {qty}
                      </span>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="outline"
                        onClick={() => bump(p.id, 1)}
                      >
                        +
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {totalItems === 0 ? (
        <aside className="h-fit rounded-3xl border border-dashed border-primary/30 bg-secondary/10 p-5 text-sm text-muted-foreground">
          {t("gifts.createOwn.addItemsHint")}
        </aside>
        ) : (
        <aside className="h-fit space-y-4 rounded-3xl border border-primary/30 bg-secondary/15 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {t("gifts.builder.summary")}
          </p>

          <div className="space-y-2">
            <Label htmlFor="builder-msg">{t("gifts.builder.card")}</Label>
            <Textarea
              id="builder-msg"
              rows={3}
              value={cardMessage}
              onChange={(e) => setCardMessage(e.target.value)}
              placeholder={t("gifts.builder.card.placeholder")}
              className="border-primary/20 bg-card/40"
            />
          </div>

          <GiftDeliveryFields
            value={delivery}
            onChange={setDelivery}
            pickupBranches={pickupBranches}
            className="border-primary/30 bg-black/20"
          />

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("gifts.builder.items")}</span>
              <span className="tabular-nums">{totalItems}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("gifts.builder.itemsTotal")}
              </span>
              <span className="tabular-nums">{formatKwd(itemsTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("gifts.builder.wrapTotal")}
              </span>
              <span className="tabular-nums">{formatKwd(wrapTotal)}</span>
            </div>
          </div>

          <div className="flex justify-between border-t border-border/40 pt-3 font-heading text-lg text-primary">
            <span>{t("gifts.builder.total")}</span>
            <span className="tabular-nums">{formatKwd(bundleTotal)}</span>
          </div>

          {minReached ? (
            <p className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
              {t("gifts.builder.minReached")}
            </p>
          ) : (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-400">
              {t("gifts.builder.minNote", { amount: remainingKwd.toFixed(3) })}
            </p>
          )}

          <Button
            type="button"
            className="w-full gap-2 rounded-xl py-6"
            onClick={reviewBasket}
            disabled={totalItems === 0 || !minReached}
          >
            <Gift className="size-4" />
            {t("gifts.builder.reviewBasket")}
          </Button>
        </aside>
        )}
      </div>

      <GiftBasketSummaryDialog
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        summary={summary}
        onClose={resetForm}
      />
    </>
  );
}
