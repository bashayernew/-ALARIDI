"use client";

import * as React from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatKwd } from "@/lib/format";
import { useI18n } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";
import type { GiftBasketDTO } from "@/lib/gift-baskets";
import { GiftDeliveryFields } from "@/components/gifts/gift-delivery-fields";
import { GiftBasketSummaryDialog } from "@/components/gifts/gift-basket-summary-dialog";
import {
  emptyGiftDelivery,
  validateGiftDelivery,
  type GiftLineDelivery,
} from "@/lib/gift-delivery";
import type { GiftBasketOrderSummary } from "@/lib/gift-basket-order";
import type { PickupBranchOption } from "@/lib/pickup-branch";

function BasketBadges({ basket }: { basket: GiftBasketDTO }) {
  const { t } = useI18n();
  const badges: string[] = [];
  if (basket.isFeatured) badges.push(t("gifts.baskets.badge.featured"));
  if (basket.isSeasonal) badges.push(t("gifts.baskets.badge.seasonal"));
  if (basket.isNew) badges.push(t("gifts.baskets.badge.new"));
  if (basket.isBestSeller) badges.push(t("gifts.baskets.badge.bestSeller"));
  if (badges.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((b) => (
        <Badge key={b} variant="secondary" className="text-[10px] uppercase">
          {b}
        </Badge>
      ))}
    </div>
  );
}

function GiftBasketCard({
  basket,
  pickupBranches,
  defaultPickupBranchId,
}: {
  basket: GiftBasketDTO;
  pickupBranches: PickupBranchOption[];
  defaultPickupBranchId: string;
}) {
  const { t } = useI18n();
  const [cardMessage, setCardMessage] = React.useState("");
  const [delivery, setDelivery] = React.useState<GiftLineDelivery>(() =>
    emptyGiftDelivery(defaultPickupBranchId)
  );
  const [open, setOpen] = React.useState(false);
  const [summaryOpen, setSummaryOpen] = React.useState(false);
  const [summary, setSummary] = React.useState<GiftBasketOrderSummary | null>(null);

  function reviewOrder() {
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

    const items = basket.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPriceKwd: item.priceKwd,
    }));
    const itemsTotalKwd = items.reduce(
      (sum, item) => sum + item.unitPriceKwd * item.quantity,
      0
    );
    const wrapTotalKwd =
      basket.includeGiftWrap && basket.priceKwd > itemsTotalKwd
        ? Math.round((basket.priceKwd - itemsTotalKwd) * 1000) / 1000
        : undefined;

    const deliveryPayload = {
      ...delivery,
      receiverName: delivery.receiverName.trim(),
      receiverPhone: delivery.receiverPhone.trim(),
      receiverAddress: delivery.receiverAddress?.trim(),
      deliveryNotes: delivery.deliveryNotes?.trim(),
    };

    setSummary({
      title: basket.name,
      items,
      itemsTotalKwd,
      wrapTotalKwd,
      totalKwd: basket.priceKwd,
      cardMessage: cardMessage.trim() || undefined,
      delivery: deliveryPayload,
    });
    setOpen(false);
    setSummaryOpen(true);
  }

  function resetForm() {
    setCardMessage("");
    setDelivery(emptyGiftDelivery(defaultPickupBranchId));
    setOpen(false);
    setSummary(null);
  }

  return (
    <>
      <article className="overflow-hidden rounded-3xl border border-border/60 bg-card/40">
        <div className="relative aspect-[4/3] bg-muted">
          <Image
            src={basket.image}
            alt={basket.name}
            fill
            sizes="(max-width:768px) 100vw, 33vw"
            className="object-cover"
          />
        </div>
        <div className="space-y-3 p-5">
          <BasketBadges basket={basket} />
          <h3 className="font-heading text-2xl leading-snug">{basket.name}</h3>
          {basket.description ? (
            <p className="line-clamp-3 text-sm text-muted-foreground">
              {basket.description}
            </p>
          ) : null}
          <ul className="space-y-1 text-xs text-muted-foreground">
            {basket.items.slice(0, 4).map((item) => (
              <li key={item.productId}>
                {item.quantity}× {item.name}
              </li>
            ))}
            {basket.items.length > 4 ? (
              <li>
                {t("gifts.baskets.moreItems", { count: basket.items.length - 4 })}
              </li>
            ) : null}
          </ul>
          <p className="text-lg tabular-nums text-primary">
            {formatKwd(basket.priceKwd)}
          </p>

          {open ? (
            <div className="space-y-3 rounded-2xl border border-border/50 bg-background/40 p-3">
              <div className="space-y-1.5">
                <Label htmlFor={`msg-${basket.id}`}>{t("gifts.builder.card")}</Label>
                <Textarea
                  id={`msg-${basket.id}`}
                  rows={2}
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
                className="border-primary/20 bg-black/20 p-3"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setOpen(false)}
                >
                  {t("admin.blog.cancel")}
                </Button>
                <Button
                  type="button"
                  className="flex-1 gap-2 rounded-xl"
                  onClick={reviewOrder}
                >
                  <Gift className="size-4" />
                  {t("gifts.baskets.reviewOrder")}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              className="w-full gap-2 rounded-xl"
              onClick={() => setOpen(true)}
            >
              <Gift className="size-4" />
              {t("gifts.baskets.reviewOrder")}
            </Button>
          )}
        </div>
      </article>

      <GiftBasketSummaryDialog
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        summary={summary}
        onClose={resetForm}
      />
    </>
  );
}

export function GiftBasketsSection({
  baskets,
  pickupBranches,
}: {
  baskets: GiftBasketDTO[];
  pickupBranches: PickupBranchOption[];
}) {
  const { t } = useI18n();
  const defaultPickupBranchId = pickupBranches[0]?.id ?? "";

  if (baskets.length === 0) {
    return (
      <p className="mt-4 text-sm text-muted-foreground">
        {t("gifts.baskets.empty")}
      </p>
    );
  }

  return (
    <div
      className={cn(
        "mt-4 grid gap-4",
        baskets.length >= 3 ? "md:grid-cols-3" : "sm:grid-cols-2"
      )}
    >
      {baskets.map((basket) => (
        <GiftBasketCard
          key={basket.id}
          basket={basket}
          pickupBranches={pickupBranches}
          defaultPickupBranchId={defaultPickupBranchId}
        />
      ))}
    </div>
  );
}
