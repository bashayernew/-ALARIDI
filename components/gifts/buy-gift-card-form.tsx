"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ShoppingBag, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/components/i18n/i18n-provider";
import { useCartStore } from "@/store/cart-store";
import { formatKwd } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { GiftCardProductDTO } from "@/lib/gift-card-products";

type Props = {
  products: GiftCardProductDTO[];
  initialProductId?: string;
  compact?: boolean;
};

export function BuyGiftCardForm({
  products,
  initialProductId,
  compact = false,
}: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const addLine = useCartStore((s) => s.addLine);
  const setCartOpen = useCartStore((s) => s.setOpen);

  const validInitial =
    initialProductId && products.some((p) => p.id === initialProductId)
      ? initialProductId
      : "";

  const [selectedId, setSelectedId] = React.useState(validInitial);
  const [open, setOpen] = React.useState(Boolean(validInitial));
  const [selectedAmount, setSelectedAmount] = React.useState<number | null>(null);
  const [customAmount, setCustomAmount] = React.useState("");
  const [recipientName, setRecipientName] = React.useState("");
  const [recipientEmail, setRecipientEmail] = React.useState("");
  const [recipientPhone, setRecipientPhone] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [deliveryDate, setDeliveryDate] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const selected = products.find((p) => p.id === selectedId);

  // Drop a stale selection if the product list changes.
  React.useEffect(() => {
    if (selectedId && !products.some((p) => p.id === selectedId)) {
      setSelectedId("");
      setOpen(false);
    }
  }, [products, selectedId]);

  // Reset the amount whenever a different card is opened.
  React.useEffect(() => {
    if (!selected) return;
    setSelectedAmount(selected.presetAmounts[0] ?? selected.priceKwd);
    setCustomAmount("");
  }, [selected?.id]);

  function openCard(id: string) {
    setSelectedId(id);
    setRecipientName("");
    setRecipientEmail("");
    setRecipientPhone("");
    setMessage("");
    setDeliveryDate("");
    setOpen(true);
  }

  function resolveAmount(): number | null {
    if (!selected) return null;
    if (selected.allowCustomAmount && customAmount.trim()) {
      const n = Number(customAmount);
      const min = selected.minCustomAmount ?? 1;
      const max = selected.maxCustomAmount ?? 500;
      if (!Number.isFinite(n) || n < min || n > max) return null;
      return Math.round(n * 1000) / 1000;
    }
    if (selectedAmount != null && selected.presetAmounts.includes(selectedAmount)) {
      return selectedAmount;
    }
    return selected.presetAmounts[0] ?? selected.priceKwd;
  }

  function addToCart(): boolean {
    if (!selected) return false;
    const amount = resolveAmount();
    if (amount == null) {
      toast.error(t("giftCard.buy.error.amount"));
      return false;
    }
    if (!recipientName.trim()) {
      toast.error(t("giftCard.buy.error.recipientName"));
      return false;
    }
    const emailValue = recipientEmail.trim();
    if (!emailValue || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      toast.error(t("giftCard.buy.error.recipientEmail"));
      return false;
    }
    if (!deliveryDate) {
      toast.error(t("giftCard.buy.error.deliveryDate"));
      return false;
    }

    setPending(true);
    addLine({
      kind: "gift_card",
      productId: selected.id,
      giftCardProductId: selected.id,
      name: selected.title,
      image: selected.image,
      price: amount,
      quantity: 1,
      giftWrap: false,
      extraToppings: false,
      recipientName: recipientName.trim(),
      recipientEmail: recipientEmail.trim() || undefined,
      cardMessage: message.trim() || undefined,
      giftDelivery: {
        fulfillmentType: "DELIVERY",
        receiverName: recipientName.trim(),
        receiverPhone: recipientPhone.trim(),
        deliveryDate,
        deliveryTimeSlot: "",
      },
    });
    toast.success(t("giftCard.buy.addedToCart"), {
      description: t("giftCard.buy.addedToCartDesc", {
        title: selected.title,
        amount: formatKwd(amount),
      }),
    });
    setPending(false);
    setRecipientName("");
    setRecipientEmail("");
    setRecipientPhone("");
    setMessage("");
    setDeliveryDate("");
    setOpen(false);
    setCartOpen(true);
    return true;
  }

  if (products.length === 0) {
    return (
      <p className="rounded-2xl border border-border/50 bg-card/30 p-6 text-sm text-muted-foreground">
        {t("giftCard.buy.noProducts")}
      </p>
    );
  }

  const amount = resolveAmount() ?? 0;

  return (
    <div className={cn("space-y-3", compact && "space-y-3")}>
      <div
        className={cn(
          "grid gap-3",
          compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"
        )}
      >
        {products.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => openCard(p.id)}
            className="group overflow-hidden rounded-2xl border border-border/60 bg-card/40 text-start transition hover:border-primary/40 hover:shadow-[0_24px_60px_-30px_rgba(0,0,0,0.5)]"
          >
            <div className="relative aspect-[5/3] bg-muted">
              <Image
                src={p.image}
                alt={p.title}
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
                sizes="(max-width:768px) 100vw, 33vw"
              />
            </div>
            <div className="space-y-1 p-4">
              <p className="font-heading text-lg leading-snug">{p.title}</p>
              {!compact && p.description ? (
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {p.description}
                </p>
              ) : null}
              <p className="pt-1 text-sm font-medium text-primary tabular-nums">
                {formatKwd(p.presetAmounts[0] ?? p.priceKwd)}
              </p>
            </div>
          </button>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="scrollbar-none max-h-[min(90vh,760px)] overflow-y-auto border-border/80 bg-popover p-0 sm:max-w-lg">
          {selected ? (
            <div>
              <div className="relative aspect-[5/3] w-full overflow-hidden bg-muted">
                <Image
                  src={selected.image}
                  alt={selected.title}
                  fill
                  className="object-cover"
                  sizes="(max-width:640px) 100vw, 512px"
                  priority
                />
              </div>
              <div className="space-y-5 p-4 sm:p-5">
                <DialogHeader>
                  <DialogTitle className="font-heading text-2xl">
                    {selected.title}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {t("giftCard.buy.amountLabel")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selected.presetAmounts.map((value) => (
                      <Button
                        key={value}
                        type="button"
                        size="sm"
                        variant={
                          selectedAmount === value && !customAmount
                            ? "default"
                            : "outline"
                        }
                        onClick={() => {
                          setSelectedAmount(value);
                          setCustomAmount("");
                        }}
                      >
                        {formatKwd(value)}
                      </Button>
                    ))}
                  </div>
                  {selected.allowCustomAmount ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="gc-custom">
                        {t("giftCard.buy.customAmount")}
                      </Label>
                      <Input
                        id="gc-custom"
                        type="number"
                        step="0.001"
                        min={selected.minCustomAmount ?? 1}
                        max={selected.maxCustomAmount ?? 500}
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder={t("giftCard.buy.customAmount.placeholder")}
                        className="border-primary/20 bg-card/40"
                      />
                    </div>
                  ) : null}
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {t("giftCard.buy.recipient")}
                  </p>
                  <div className="space-y-1.5">
                    <Label htmlFor="gc-name">
                      {t("giftCard.buy.recipientName")}
                    </Label>
                    <Input
                      id="gc-name"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder={t("giftCard.buy.recipientName.placeholder")}
                      className="border-primary/20 bg-card/40"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="gc-email">
                        {t("giftCard.buy.recipientEmail")}
                        <span className="ms-1 text-destructive">*</span>
                      </Label>
                      <Input
                        id="gc-email"
                        type="email"
                        required
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder={t("giftCard.buy.recipientEmail.placeholder")}
                        className="border-primary/20 bg-card/40"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="gc-phone">
                        {t("giftCard.buy.recipientPhone")}
                      </Label>
                      <Input
                        id="gc-phone"
                        type="tel"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        placeholder={t("giftCard.buy.recipientPhone.placeholder")}
                        className="border-primary/20 bg-card/40"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="gc-msg">{t("giftCard.buy.message")}</Label>
                    <Textarea
                      id="gc-msg"
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={t("giftCard.buy.message.placeholder")}
                      className="border-primary/20 bg-card/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="gc-date">
                      {t("giftCard.buy.deliveryDate")}
                    </Label>
                    <Input
                      id="gc-date"
                      type="date"
                      value={deliveryDate}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="border-primary/20 bg-card/40"
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  {t("giftCard.buy.disclaimer")}
                </p>

                <Button
                  type="button"
                  disabled={pending}
                  className="w-full gap-2 rounded-xl py-6"
                  onClick={() => void addToCart()}
                >
                  {pending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {t("giftCard.buy.submitting")}
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="size-4" />
                      {t("giftCard.buy.addToCart", { amount: formatKwd(amount) })}
                    </>
                  )}
                </Button>

                {!compact ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2 rounded-xl"
                    onClick={() => {
                      if (addToCart()) router.push("/checkout");
                    }}
                    disabled={pending}
                  >
                    <Gift className="size-4" />
                    {t("giftCard.buy.checkoutNow")}
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
