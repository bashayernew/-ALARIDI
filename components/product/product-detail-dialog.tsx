"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { ProductDTO } from "@/types";
import { formatKwd } from "@/lib/format";
import { useCartStore } from "@/store/cart-store";
import {
  hasWeightSizes,
  productSizeOptions,
} from "@/lib/product-sizes";
import {
  EXTRA_TOPPINGS_FEE_KWD,
  GIFT_WRAP_FEE_KWD,
} from "@/lib/pricing";
import { useI18n } from "@/components/i18n/i18n-provider";
import { displayCatalogProduct } from "@/lib/menu-display";

type Props = {
  product: ProductDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProductDetailDialog({ product, open, onOpenChange }: Props) {
  const router = useRouter();
  const { locale, t } = useI18n();
  const addLine = useCartStore((s) => s.addLine);
  const [qty, setQty] = React.useState(1);
  const [note, setNote] = React.useState("");
  const [giftWrap, setGiftWrap] = React.useState(false);
  const [cardMessage, setCardMessage] = React.useState("");
  const [extraToppings, setExtraToppings] = React.useState(false);
  const [activeImage, setActiveImage] = React.useState(0);
  const [size, setSize] = React.useState("250g");

  React.useEffect(() => {
    if (!product?.id) return;
    setQty(1);
    setNote("");
    setGiftWrap(false);
    setCardMessage("");
    setExtraToppings(false);
    setActiveImage(0);
    setSize("250g");
  }, [product?.id]);

  if (!product) return null;

  const dp = displayCatalogProduct(product, locale);
  const ox = (en: string, ar: string) => (locale === "ar" ? ar : en);

  const weightSized = hasWeightSizes(product);
  const sizeOptions = weightSized ? productSizeOptions(product, locale) : [];
  const selectedSize =
    sizeOptions.find((o) => o.key === size) ?? sizeOptions[0] ?? null;
  const unitPrice =
    weightSized && selectedSize ? selectedSize.price : product.price;
  const unitOldPrice =
    product.oldPrice != null && (!weightSized || selectedSize?.multiplier != null)
      ? product.oldPrice * (selectedSize?.multiplier ?? 1)
      : null;
  const extrasPerUnit =
    (giftWrap ? GIFT_WRAP_FEE_KWD : 0) +
    (extraToppings ? EXTRA_TOPPINGS_FEE_KWD : 0);
  const linePreview = unitPrice * qty + extrasPerUnit * qty;
  const loyaltyPoints = Math.round(linePreview * 10);
  const gallery = [product.image, product.image, product.image];

  function handleAdd() {
    const p = product;
    if (!p) return;
    const added = addLine({
      productId: p.id,
      name: dp.name,
      image: p.image,
      price: unitPrice,
      quantity: qty,
      giftWrap,
      cardMessage: cardMessage.trim() || undefined,
      extraToppings,
      note: [
        note.trim(),
        weightSized && selectedSize
          ? `${ox("Size", "الحجم")}: ${selectedSize.label}`
          : "",
      ]
        .filter(Boolean)
        .join(" | "),
    });
    if (!added) return;
    toast.success(t("product.toast.added"), { description: dp.name });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="scrollbar-none max-h-[min(90vh,720px)] overflow-y-auto border-border/80 bg-popover p-0 sm:max-w-lg">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
          <Image
            src={gallery[activeImage] ?? product.image}
            alt={dp.name}
            fill
            className="object-cover transition duration-300 hover:scale-110"
            sizes="(max-width:640px)100vw,512px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-popover via-transparent to-transparent" />
        </div>
        <div className="flex gap-2 px-4 pt-3 sm:px-5">
          {gallery.map((img, idx) => (
            <button
              key={`${img}-${idx}`}
              type="button"
              onClick={() => setActiveImage(idx)}
              className={`relative h-14 w-14 overflow-hidden rounded-lg border ${activeImage === idx ? "border-primary" : "border-border/60"}`}
            >
              <Image src={img} alt="" fill className="object-cover" sizes="56px" />
            </button>
          ))}
        </div>
        <div className="space-y-4 px-4 pb-4 pt-2 sm:px-5">
          <DialogHeader>
            <DialogTitle className="pe-8 font-heading text-2xl leading-tight">
              {dp.name}
            </DialogTitle>
            <DialogDescription className="text-base leading-relaxed">
              {dp.description}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-2xl text-primary tabular-nums">
              {formatKwd(unitPrice)}
            </span>
            {unitOldPrice != null && unitOldPrice > unitPrice && (
              <span className="text-muted-foreground line-through tabular-nums">
                {formatKwd(unitOldPrice)}
              </span>
            )}
          </div>
          <div className="grid gap-3">
            {weightSized ? (
              <div className="space-y-1.5">
                <Label>{t("product.size")}</Label>
                <div className="flex flex-wrap gap-2">
                  {sizeOptions.map((w) => (
                    <button
                      key={w.key}
                      type="button"
                      onClick={() => setSize(w.key)}
                      className={
                        selectedSize?.key === w.key
                          ? "min-w-[30%] flex-1 rounded-lg border border-primary bg-primary/10 px-2 py-2 text-sm font-semibold text-primary"
                          : "min-w-[30%] flex-1 rounded-lg border border-border/60 bg-muted/20 px-2 py-2 text-sm text-muted-foreground hover:border-primary/40"
                      }
                    >
                      <span className="block">{w.label}</span>
                      <span className="block text-xs tabular-nums opacity-80">
                        {formatKwd(w.price)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="rounded-xl border border-border/50 bg-muted/20 p-3 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">{t("product.ingredients")}</span>{" "}
                {t("product.ingredients.text")}
              </p>
              <p className="mt-1">
                <span className="font-medium text-foreground">{t("product.allergens")}</span>{" "}
                {t("product.allergens.text")}
              </p>
              <p className="mt-1">
                <span className="font-medium text-foreground">{t("product.stock")}</span>{" "}
                {t("product.stock.sameDay")}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="qty">{t("product.qty")}</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  −
                </Button>
                <Input
                  id="qty"
                  inputMode="numeric"
                  className="h-9 w-14 text-center tabular-nums"
                  value={qty}
                  onChange={(e) => {
                    const v = Number.parseInt(e.target.value, 10);
                    if (Number.isFinite(v) && v >= 1) setQty(v);
                    if (e.target.value === "") setQty(1);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setQty((q) => q + 1)}
                >
                  +
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note">{t("product.note")}</Label>
              <Textarea
                id="note"
                placeholder={t("product.note.placeholder")}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="space-y-3 rounded-xl border border-border/60 bg-card/40 p-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                {t("product.addons")}
              </p>
              <label className="flex cursor-pointer items-start gap-3">
                <Checkbox
                  checked={giftWrap}
                  onCheckedChange={(v) => setGiftWrap(v === true)}
                />
                <span>
                  <span className="font-medium">{t("product.giftWrap")}</span>
                  <span className="block text-xs text-muted-foreground">
                    +{formatKwd(GIFT_WRAP_FEE_KWD)} {t("product.giftWrap.per")}
                  </span>
                </span>
              </label>
              <div className="space-y-1.5">
                <Label htmlFor="card">{t("product.cardMessage")}</Label>
                <Input
                  id="card"
                  placeholder={t("product.card.placeholder")}
                  value={cardMessage}
                  onChange={(e) => setCardMessage(e.target.value)}
                />
              </div>
              <label className="flex cursor-pointer items-start gap-3">
                <Checkbox
                  checked={extraToppings}
                  onCheckedChange={(v) => setExtraToppings(v === true)}
                />
                <span>
                  <span className="font-medium">{t("product.extraToppings")}</span>
                  <span className="block text-xs text-muted-foreground">
                    +{formatKwd(EXTRA_TOPPINGS_FEE_KWD)} {t("product.giftWrap.per")}
                  </span>
                </span>
              </label>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-3 py-2 text-sm">
              <span className="text-muted-foreground">{t("product.lineTotal")}</span>
              <span className="font-heading text-lg tabular-nums text-primary">
                {formatKwd(linePreview)}
              </span>
            </div>
            <p className="text-xs text-primary">
              {t("product.points", { points: loyaltyPoints })}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" className="w-full rounded-xl py-6 text-base" onClick={handleAdd}>
                {t("product.addToCart")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl py-6 text-base"
                onClick={() => {
                  handleAdd();
                  router.push("/checkout");
                }}
              >
                {t("product.buyNow")}
              </Button>
            </div>
            <div className="rounded-xl border border-border/50 bg-muted/20 p-3 text-sm">
              <p className="font-medium">{t("product.related")}</p>
              <p className="text-muted-foreground">{t("product.related.placeholder")}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
