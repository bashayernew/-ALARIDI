"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore, cartLineKey, isGiftCardLine, isGiftBasketLine, isCheckoutLine } from "@/store/cart-store";
import { cartSubtotal } from "@/lib/cart-totals";
import { formatKwd } from "@/lib/format";
import { useI18n } from "@/components/i18n/i18n-provider";
import { GiftDeliverySummaryLine } from "@/components/gifts/gift-delivery-summary";

export function CartDrawer() {
  const { t, dir } = useI18n();
  const router = useRouter();
  const open = useCartStore((s) => s.open);
  const setOpen = useCartStore((s) => s.setOpen);
  const lines = useCartStore((s) => s.lines);
  const checkoutLines = lines.filter(isCheckoutLine);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeLine = useCartStore((s) => s.removeLine);

  const subtotal = cartSubtotal(checkoutLines);
  const sheetSide = dir === "rtl" ? "left" : "right";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side={sheetSide}
        className="w-full gap-0 border-border/80 p-0 data-[state=open]:border-e sm:max-w-md"
      >
        <SheetHeader className="border-b border-border/60 px-4 py-4">
          <SheetTitle className="font-heading text-xl">{t("cart.drawer.title")}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {checkoutLines.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {lines.length > 0
                  ? t("cart.drawer.giftBasketsWhatsAppOnly")
                  : t("cart.drawer.empty")}
              </p>
            ) : (
              checkoutLines.map((line) => {
                const key = cartLineKey(line);
                return (
                  <div
                    key={key}
                    className="flex gap-3 rounded-xl border border-border/50 bg-card/60 p-3"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={line.image}
                        alt={line.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium leading-snug">{line.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {isGiftCardLine(line)
                          ? t("cart.giftCardLine")
                          : isGiftBasketLine(line)
                            ? t("cart.giftBasketLine")
                            : formatKwd(line.price)}{" "}
                        {!isGiftCardLine(line) && !isGiftBasketLine(line)
                          ? t("cart.each")
                          : null}
                        {isGiftCardLine(line) || isGiftBasketLine(line)
                          ? ` · ${formatKwd(line.price)}`
                          : null}
                      </p>
                      {line.giftDelivery ? (
                        <GiftDeliverySummaryLine delivery={line.giftDelivery} />
                      ) : null}
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-xs"
                          className="shrink-0"
                          onClick={() =>
                            setQuantity(key, line.quantity - 1)
                          }
                        >
                          <Minus className="size-3" />
                        </Button>
                        <span className="min-w-6 text-center text-sm tabular-nums">
                          {line.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-xs"
                          className="shrink-0"
                          onClick={() =>
                            setQuantity(key, line.quantity + 1)
                          }
                        >
                          <Plus className="size-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="ms-auto text-destructive hover:text-destructive"
                          onClick={() => removeLine(key)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <SheetFooter className="border-t border-border/60 bg-card/40 p-4">
            <div className="mb-3 flex w-full items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("cart.subtotal")}</span>
              <span className="font-medium tabular-nums">{formatKwd(subtotal)}</span>
            </div>
            <Separator className="mb-3 bg-border/60" />
            <Button
              className="w-full"
              disabled={!checkoutLines.length}
              onClick={() => {
                setOpen(false);
                router.push("/checkout");
              }}
            >
              {t("cart.checkout")}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
