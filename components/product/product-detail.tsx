"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import type { ProductDTO } from "@/types";
import { formatKwd } from "@/lib/format";
import { useCartStore } from "@/store/cart-store";
import {
  WEIGHT_SIZES,
  hasWeightSizes,
  weightSizeMultiplier,
} from "@/lib/product-sizes";
import {
  EXTRA_TOPPINGS_FEE_KWD,
  GIFT_WRAP_FEE_KWD,
} from "@/lib/pricing";
import { pointsEarnedFor } from "@/lib/loyalty";
import { useI18n } from "@/components/i18n/i18n-provider";
import { useCustomerAuth } from "@/components/auth/customer-auth-provider";
import { toggleWishlist } from "@/actions/wishlist";
import { ProductCard } from "@/components/product/product-card";

type Props = {
  product: ProductDTO;
  related: ProductDTO[];
  initialInWishlist: boolean;
};

export function ProductDetail({
  product,
  related,
  initialInWishlist,
}: Props) {
  const router = useRouter();
  const { locale, t } = useI18n();
  const { user } = useCustomerAuth();
  const addLine = useCartStore((s) => s.addLine);

  const name = locale === "ar" && product.nameAr ? product.nameAr : product.name;
  const description =
    locale === "ar" && product.descriptionAr
      ? product.descriptionAr
      : product.description;
  const ingredientsText =
    locale === "ar" && product.ingredientsAr
      ? product.ingredientsAr
      : product.ingredients;

  const [activeImage, setActiveImage] = React.useState(0);
  const [qty, setQty] = React.useState(1);
  const [note, setNote] = React.useState("");
  const [giftWrap, setGiftWrap] = React.useState(false);
  const [cardMessage, setCardMessage] = React.useState("");
  const [extraToppings, setExtraToppings] = React.useState(false);
  const weightSized = hasWeightSizes(product);
  const [size, setSize] = React.useState(weightSized ? "250g" : "");
  const [inWishlist, setInWishlist] = React.useState(initialInWishlist);
  const [wishlistPending, setWishlistPending] = React.useState(false);

  const ox = (en: string, ar: string) => (locale === "ar" ? ar : en);

  const sizeMultiplier = weightSized ? weightSizeMultiplier(size) : 1;
  const unitPrice = product.price * sizeMultiplier;
  const unitOldPrice =
    product.oldPrice != null ? product.oldPrice * sizeMultiplier : null;
  const extrasPerUnit =
    (giftWrap ? GIFT_WRAP_FEE_KWD : 0) +
    (extraToppings ? EXTRA_TOPPINGS_FEE_KWD : 0);
  const lineTotal = unitPrice * qty + extrasPerUnit * qty;
  const tier = user?.tier ?? "SILVER";
  const loyaltyPoints = pointsEarnedFor(lineTotal, tier);

  const inStock =
    product.stockQty == null || product.stockQty >= qty;

  function handleAdd() {
    if (!inStock) {
      toast.error(t("product.stock.outOfStock"));
      return;
    }
    addLine({
      productId: product.id,
      name,
      image: product.image,
      price: unitPrice,
      quantity: qty,
      giftWrap,
      cardMessage: cardMessage.trim() || undefined,
      extraToppings,
      note: [
        note.trim(),
        weightSized
          ? `${ox("Size", "الحجم")}: ${
              WEIGHT_SIZES.find((w) => w.key === size)?.[
                locale === "ar" ? "labelAr" : "labelEn"
              ] ?? size
            }`
          : "",
      ]
        .filter(Boolean)
        .join(" | "),
    });
    toast.success(t("product.toast.added"), { description: name });
  }

  async function handleWishlist() {
    if (!user) {
      router.push(
        `/login?next=${encodeURIComponent(`/product/${product.slug}`)}`
      );
      return;
    }
    setWishlistPending(true);
    const res = await toggleWishlist(product.id);
    setWishlistPending(false);
    if (res.ok) {
      setInWishlist(res.inWishlist);
      toast.success(
        res.inWishlist
          ? t("product.wishlist.added")
          : t("product.wishlist.removed")
      );
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <nav className="text-xs text-muted-foreground">
        <Link href="/menu" className="hover:text-primary">
          ← {t("product.backToMenu")}
        </Link>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-muted">
            <Image
              src={product.images[activeImage] ?? product.image}
              alt={name}
              fill
              priority
              sizes="(max-width:1024px) 100vw, 600px"
              className="object-cover transition duration-500 hover:scale-110"
            />
            {product.isPromo && (
              <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-foreground">
                {t("product.badge.sale")}
              </span>
            )}
            {product.isNew && (
              <span className="absolute right-3 top-3 rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
                {t("product.badge.new")}
              </span>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  onClick={() => setActiveImage(idx)}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border ${
                    activeImage === idx
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border/60"
                  }`}
                >
                  <Image src={img} alt="" fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              {product.category.replaceAll("_", " ")}
            </p>
            <h1 className="mt-2 font-heading text-4xl">{name}</h1>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="font-heading text-3xl text-primary tabular-nums">
              {formatKwd(unitPrice)}
            </span>
            {unitOldPrice != null && unitOldPrice > unitPrice && (
              <span className="text-muted-foreground line-through tabular-nums">
                {formatKwd(unitOldPrice)}
              </span>
            )}
            {!inStock ? (
              <span className="rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-medium text-destructive">
                {t("product.stock.outOfStock")}
              </span>
            ) : product.stockQty != null && product.stockQty < 10 ? (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300">
                {t("product.stock.low", { count: product.stockQty })}
              </span>
            ) : (
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-300">
                {t("product.stock.inStock")}
              </span>
            )}
          </div>

          <p className="text-base leading-relaxed text-muted-foreground">
            {description}
          </p>

          {weightSized ? (
            <div className="space-y-1.5">
              <Label>{t("product.size")}</Label>
              <div className="flex gap-2">
                {WEIGHT_SIZES.map((w) => (
                  <button
                    key={w.key}
                    type="button"
                    onClick={() => setSize(w.key)}
                    className={
                      size === w.key
                        ? "flex-1 rounded-lg border border-primary bg-primary/10 px-2 py-2.5 text-sm font-semibold text-primary"
                        : "flex-1 rounded-lg border border-border/60 bg-muted/20 px-2 py-2.5 text-sm text-muted-foreground hover:border-primary/40"
                    }
                  >
                    <span className="block">
                      {locale === "ar" ? w.labelAr : w.labelEn}
                    </span>
                    <span className="block text-xs tabular-nums opacity-80">
                      {formatKwd(product.price * w.multiplier)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

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

          <div className="space-y-3 rounded-2xl border border-border/60 bg-card/40 p-4">
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
            <span className="font-heading text-xl tabular-nums text-primary">
              {formatKwd(lineTotal)}
            </span>
          </div>
          <p className="text-xs text-primary">
            {t("product.points", { points: loyaltyPoints })}
          </p>

          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <Button
              type="button"
              className="w-full rounded-xl py-6 text-base"
              onClick={handleAdd}
              disabled={!inStock}
            >
              {t("product.addToCart")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl py-6 text-base"
              onClick={() => {
                handleAdd();
                if (inStock) router.push("/checkout");
              }}
              disabled={!inStock}
            >
              {t("product.buyNow")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={`h-auto rounded-xl py-6 ${
                inWishlist ? "border-primary text-primary" : ""
              }`}
              onClick={handleWishlist}
              disabled={wishlistPending}
              aria-label={t("product.wishlist.toggle")}
              title={t("product.wishlist.toggle")}
            >
              <Heart
                className={`size-5 ${inWishlist ? "fill-current" : ""}`}
              />
            </Button>
          </div>
        </div>
      </div>

      {/* Ingredients & allergens */}
      {(ingredientsText || product.allergens.length > 0) && (
        <section className="mt-12 rounded-2xl border border-border/60 bg-card/30 p-6">
          <h2 className="font-heading text-2xl">
            {t("product.details.title")}
          </h2>
          <Separator className="my-4 bg-border/60" />
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                {t("product.ingredients")}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {ingredientsText || t("product.ingredients.text")}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                {t("product.allergens")}
              </p>
              {product.allergens.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {product.allergens.map((a) => (
                    <li
                      key={a}
                      className="rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs"
                    >
                      {a}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("product.allergens.text")}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="font-heading text-2xl">{t("product.related")}</h2>
          <Separator className="my-4 bg-border/60" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
