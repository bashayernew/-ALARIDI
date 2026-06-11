"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore, cartLineKey, isCheckoutLine } from "@/store/cart-store";
import { cartSubtotal } from "@/lib/cart-totals";
import { formatKwd } from "@/lib/format";
import { getDeliveryFee } from "@/lib/delivery";
import { useI18n } from "@/components/i18n/i18n-provider";

export default function CartPage() {
  const { t } = useI18n();
  const lines = useCartStore((s) => s.lines);
  const checkoutLines = lines.filter(isCheckoutLine);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeLine = useCartStore((s) => s.removeLine);
  const subtotal = cartSubtotal(checkoutLines);
  const estimatedDelivery = getDeliveryFee(subtotal, "salmiya");
  const estimatedPoints = Math.round((subtotal + estimatedDelivery) * 10);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-heading text-4xl">{t("cart.page.title")}</h1>
      {checkoutLines.length === 0 ? (
        <p className="mt-4 text-muted-foreground">
          {lines.length > 0
            ? t("cart.drawer.giftBasketsWhatsAppOnly")
            : t("cart.page.empty")}{" "}
          <Link href="/menu" className="text-primary">
            {t("cart.page.browse")}
          </Link>
        </p>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {checkoutLines.map((line) => {
              const key = cartLineKey(line);
              return (
                <div
                  key={key}
                  className="flex gap-4 rounded-2xl border border-border/60 bg-card/40 p-4"
                >
                  <div className="relative h-20 w-20 overflow-hidden rounded-xl">
                    <Image src={line.image} alt={line.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{line.name}</p>
                    <p className="text-sm text-muted-foreground">{formatKwd(line.price)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded border border-border/60 p-1"
                        onClick={() => setQuantity(key, line.quantity - 1)}
                      >
                        <Minus className="size-3" />
                      </button>
                      <span>{line.quantity}</span>
                      <button
                        type="button"
                        className="rounded border border-border/60 p-1"
                        onClick={() => setQuantity(key, line.quantity + 1)}
                      >
                        <Plus className="size-3" />
                      </button>
                      <button
                        type="button"
                        className="ms-2 rounded border border-border/60 p-1 text-destructive"
                        onClick={() => removeLine(key)}
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <aside className="h-fit rounded-2xl border border-border/60 bg-card/40 p-5">
            <label className="text-sm">
              {t("cart.page.promo")}
              <input
                className="mt-1 h-10 w-full rounded-lg border border-border/60 bg-background px-3"
                placeholder={t("cart.page.promo.placeholder")}
              />
            </label>
            <p className="mt-3 text-sm text-muted-foreground">{t("cart.page.addons")}</p>
            <div className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{t("cart.page.subtotal")}</span>
                <span>{formatKwd(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("cart.page.estimatedDelivery")}</span>
                <span>{formatKwd(estimatedDelivery)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("cart.page.pointsLabel")}</span>
                <span>{t("cart.page.pointsValue", { points: estimatedPoints })}</span>
              </div>
            </div>
            <Link
              href="/checkout"
              className="mt-5 inline-flex w-full justify-center rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground"
            >
              {t("cart.page.checkout")}
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
