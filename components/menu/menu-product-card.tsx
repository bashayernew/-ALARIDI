"use client";

import * as React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Loader2, Plus, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { MenuProduct } from "@/lib/menu-data";
import { formatKwd, discountPercent } from "@/lib/format";
import { useCartStore } from "@/store/cart-store";
import { cn } from "@/lib/utils";
import { displayMenuProduct } from "@/lib/menu-display";
import { useI18n } from "@/components/i18n/i18n-provider";

type Props = {
  product: MenuProduct;
  onCustomize?: (p: MenuProduct) => void;
  onOpen?: (p: MenuProduct) => void;
};

export function MenuProductCard({ product, onCustomize, onOpen }: Props) {
  const { locale, t } = useI18n();
  const dp = displayMenuProduct(product, locale);
  const addLine = useCartStore((s) => s.addLine);
  const [imgErr, setImgErr] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const hasDiscount =
    product.oldPrice != null && product.oldPrice > product.price;
  const pct = hasDiscount
    ? discountPercent(product.price, product.oldPrice!)
    : 0;

  function stockLabel() {
    if (!product.stock) return null;
    if (product.stock === "in-stock") return t("menu.stock.in");
    if (product.stock === "low-stock") return t("menu.stock.low");
    return t("menu.stock.out");
  }

  function quickAdd() {
    if (product.customizable && onCustomize) {
      onCustomize(product);
      return;
    }
    setBusy(true);
    addLine({
      productId: product.id,
      name: dp.name,
      image: product.image,
      price: product.price,
      quantity: 1,
      giftWrap: false,
      extraToppings: false,
    });
    toast.success(t("product.toast.added"), { description: dp.name });
    window.setTimeout(() => setBusy(false), 350);
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className={cn(
        "group relative flex flex-row-reverse gap-4 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.18)] transition-all duration-300",
        "hover:border-primary/30 hover:shadow-[0_24px_60px_-22px_rgba(201,169,110,0.12)] sm:p-5",
        onOpen && "cursor-pointer"
      )}
    >
      {onOpen ? (
        <button
          type="button"
          onClick={() => onOpen(product)}
          aria-label={t("menu.cta.viewDetails", { name: dp.name })}
          className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        />
      ) : null}
      <div className="relative h-[7.5rem] w-[7.5rem] shrink-0 overflow-hidden rounded-xl border border-border bg-muted sm:h-32 sm:w-32">
        {!imgErr ? (
          <Image
            src={product.image}
            alt={dp.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="128px"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-accent via-card to-background p-2 text-center">
            <span className="font-heading text-[10px] leading-tight text-primary/90 line-clamp-4 sm:text-xs">
              {dp.name}
            </span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {product.bestSeller && (
            <Badge className="border border-primary/35 bg-primary/15 text-[10px] uppercase tracking-wide text-primary">
              {t("menu.badge.bestSeller")}
            </Badge>
          )}
          {product.isNew && (
            <Badge className="border border-emerald-400/40 bg-emerald-500/15 text-[10px] uppercase tracking-wide text-emerald-300">
              {t("menu.badge.new")}
            </Badge>
          )}
          {hasDiscount && pct > 0 && (
            <Badge className="border border-red-400/40 bg-red-600/80 text-[10px] font-semibold text-white">
              {t("menu.card.percentOff", { pct })}
            </Badge>
          )}
          {product.promo && !hasDiscount && (
            <Badge variant="outline" className="text-[10px] text-primary">
              {t("menu.badge.promo")}
            </Badge>
          )}
          {product.customizable && (
            <Badge
              variant="outline"
              className="border-primary/25 text-[10px] text-muted-foreground"
            >
              {t("menu.badge.customizable")}
            </Badge>
          )}
          {hasDiscount && (
            <Badge
              variant="outline"
              className="border-red-400/40 text-[10px] text-red-300"
            >
              {t("menu.badge.sale")}
            </Badge>
          )}
        </div>

        <h3 className="font-heading text-lg leading-snug text-foreground sm:text-xl">
          {dp.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {dp.description}
        </p>

        {product.stock && (
          <p className="mt-1 text-xs text-muted-foreground">{stockLabel()}</p>
        )}

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-heading text-lg text-primary tabular-nums sm:text-xl">
              {formatKwd(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-red-400/90 line-through tabular-nums">
                {formatKwd(product.oldPrice!)}
              </span>
            )}
          </div>
          <Button
            type="button"
            size="sm"
            variant={product.customizable ? "outline" : "default"}
            className={cn(
              "relative z-20 shrink-0 rounded-xl border-primary/25",
              !product.customizable && "gold-glow"
            )}
            disabled={busy}
            onClick={(e) => {
              e.stopPropagation();
              quickAdd();
            }}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : product.customizable ? (
              <>
                <Settings2 className="size-3.5" />
                {t("menu.cta.customize")}
              </>
            ) : (
              <>
                <Plus className="size-3.5" />
                {t("menu.cta.add")}
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
