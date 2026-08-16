"use client";

import * as React from "react";
import { MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/components/i18n/i18n-provider";
import { useSocialUrls } from "@/components/site-extras-provider";
import { DEFAULT_SOCIAL_URLS } from "@/lib/site-content-types";
import { formatKwd } from "@/lib/format";
import {
  buildGiftBasketWhatsAppUrl,
  formatGiftBasketOrderSummaryDelivery,
  type GiftBasketOrderSummary,
} from "@/lib/gift-basket-order";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: GiftBasketOrderSummary | null;
  onClose?: () => void;
};

export function GiftBasketSummaryDialog({
  open,
  onOpenChange,
  summary,
  onClose,
}: Props) {
  const { t, locale } = useI18n();
  const socialUrls = useSocialUrls();
  const whatsappBase = socialUrls?.whatsapp ?? DEFAULT_SOCIAL_URLS.whatsapp;

  function handleClose(next: boolean) {
    onOpenChange(next);
    if (!next) onClose?.();
  }

  const whatsappUrl = summary
    ? buildGiftBasketWhatsAppUrl(summary, locale, whatsappBase)
    : undefined;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-primary/25 bg-background sm:max-w-lg">
        {summary ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl text-gradient-gold">
                {t("gifts.basketSummary.title")}
              </DialogTitle>
              <DialogDescription>{t("gifts.basketSummary.subtitle")}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-2xl border border-primary/20 bg-secondary/10 p-4">
                <h3 className="font-heading text-xl">{summary.title}</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {summary.items.map((item) => (
                    <li
                      key={`${item.name}-${item.quantity}`}
                      className="flex justify-between gap-3"
                    >
                      <span>
                        {item.quantity}× {item.name}
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {formatKwd(item.unitPriceKwd * item.quantity)}
                      </span>
                    </li>
                  ))}
                  {summary.wrapTotalKwd != null && summary.wrapTotalKwd > 0 ? (
                    <li className="flex justify-between gap-3 text-muted-foreground">
                      <span>{t("gifts.builder.wrapTotal")}</span>
                      <span className="tabular-nums">
                        {formatKwd(summary.wrapTotalKwd)}
                      </span>
                    </li>
                  ) : null}
                </ul>
                <Separator className="my-3 bg-primary/15" />
                <div className="flex justify-between font-heading text-lg text-primary">
                  <span>{t("gifts.basketSummary.total")}</span>
                  <span className="tabular-nums">{formatKwd(summary.totalKwd)}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card/40 p-4 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {t("gifts.basketSummary.receiver")}
                </p>
                <p className="mt-2 font-medium">{summary.delivery.receiverName}</p>
                <p className="text-muted-foreground">{summary.delivery.receiverPhone}</p>
                <p className="mt-3 text-xs leading-relaxed text-primary/90">
                  {formatGiftBasketOrderSummaryDelivery(summary.delivery, locale)}
                </p>
                {summary.cardMessage?.trim() ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {t("gifts.basketSummary.cardMessage")}:{" "}
                    </span>
                    {summary.cardMessage.trim()}
                  </p>
                ) : null}
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "inline-flex w-full gap-2 rounded-xl bg-[#25D366] py-6 text-base text-white hover:bg-[#1ebe5d]"
                )}
              >
                <MessageCircle className="size-5" />
                {t("gifts.basketSummary.whatsappCta")}
              </a>

              <p className="text-center text-xs text-muted-foreground">
                {t("gifts.basketSummary.whatsappHint")}
              </p>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
