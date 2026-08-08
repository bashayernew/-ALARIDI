"use client";

import { toast } from "sonner";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { giftDeliveryKey, type GiftLineDelivery } from "@/lib/gift-delivery";

export type { GiftLineDelivery };

export type CartLineKind = "product" | "gift_card" | "gift_basket";

export type CartLine = {
  kind?: CartLineKind;
  productId: string;
  giftCardProductId?: string;
  giftBasketId?: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  note?: string;
  giftWrap: boolean;
  cardMessage?: string;
  extraToppings: boolean;
  recipientName?: string;
  recipientEmail?: string;
  giftDelivery?: GiftLineDelivery;
};

function lineKey(
  l: Pick<
    CartLine,
    | "kind"
    | "productId"
    | "giftCardProductId"
    | "giftBasketId"
    | "note"
    | "giftWrap"
    | "cardMessage"
    | "extraToppings"
    | "recipientName"
    | "recipientEmail"
    | "giftDelivery"
    | "price"
  >
) {
  const kind = l.kind ?? "product";
  const deliveryPart = giftDeliveryKey(l.giftDelivery);
  if (kind === "gift_card") {
    return [
      "gc",
      l.giftCardProductId ?? l.productId,
      String(l.price ?? 0),
      l.recipientName ?? "",
      l.recipientEmail ?? "",
      l.cardMessage ?? "",
      deliveryPart,
    ].join("|");
  }
  if (kind === "gift_basket") {
    return [
      "gb",
      l.giftBasketId ?? l.productId,
      l.recipientName ?? "",
      l.cardMessage ?? "",
      deliveryPart,
    ].join("|");
  }
  return [
    "p",
    l.productId,
    l.note ?? "",
    l.giftWrap ? "1" : "0",
    l.cardMessage ?? "",
    l.extraToppings ? "1" : "0",
    deliveryPart,
  ].join("|");
}

type CartState = {
  lines: CartLine[];
  open: boolean;
  setOpen: (v: boolean) => void;
  addLine: (line: Omit<CartLine, "quantity"> & { quantity?: number }) => void;
  setQuantity: (key: string, qty: number) => void;
  removeLine: (key: string) => void;
  clear: () => void;
};

function normalizeLine(line: CartLine): CartLine {
  const kind = line.kind ?? "product";
  if (kind === "gift_card") {
    return {
      ...line,
      kind,
      giftWrap: false,
      extraToppings: false,
      giftCardProductId: line.giftCardProductId ?? line.productId,
    };
  }
  if (kind === "gift_basket") {
    return {
      ...line,
      kind,
      giftWrap: false,
      extraToppings: false,
      giftBasketId: line.giftBasketId ?? line.productId,
    };
  }
  return {
    ...line,
    kind,
    giftWrap: line.giftWrap ?? false,
    extraToppings: line.extraToppings ?? false,
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      open: false,
      setOpen: (open) => set({ open }),
      addLine: (line) => {
        const qty = line.quantity ?? 1;
        const next = normalizeLine({ ...line, quantity: qty });

        // Gift cards are emailed (no delivery), so they must be checked out
        // on their own — never mixed with products or baskets.
        const ar =
          typeof document !== "undefined" &&
          document.documentElement.lang === "ar";
        const existing = get().lines;
        const addingGiftCard = (next.kind ?? "product") === "gift_card";
        const hasGiftCard = existing.some((l) => (l.kind ?? "product") === "gift_card");
        const hasOther = existing.some((l) => (l.kind ?? "product") !== "gift_card");
        if (addingGiftCard && hasOther) {
          toast.error(
            ar
              ? "بطاقات الهدايا تُشترى بشكل منفصل — أكمل طلب المنتجات أولاً ثم اشترِ البطاقة."
              : "Gift cards are checked out separately — complete your product order first, then buy the gift card."
          );
          return;
        }
        if (!addingGiftCard && hasGiftCard) {
          toast.error(
            ar
              ? "سلتك تحتوي على بطاقة هدية — أكمل شراء البطاقة أولاً ثم اطلب المنتجات."
              : "Your cart has a gift card — checkout the gift card first, then order products."
          );
          return;
        }
        const key = lineKey(next);
        const lines = get().lines.map(normalizeLine);
        const idx = lines.findIndex((l) => lineKey(l) === key);
        if (idx >= 0) {
          const copy = [...lines];
          copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + qty };
          set({ lines: copy, open: true });
          return;
        }
        set({ lines: [...lines, next], open: true });
      },
      setQuantity: (key, qty) => {
        if (qty < 1) {
          set({ lines: get().lines.filter((l) => lineKey(l) !== key) });
          return;
        }
        set({
          lines: get().lines.map((l) =>
            lineKey(l) === key ? { ...l, quantity: qty } : l
          ),
        });
      },
      removeLine: (key) =>
        set({ lines: get().lines.filter((l) => lineKey(l) !== key) }),
      clear: () => set({ lines: [] }),
    }),
    {
      name: "al-aridi-cart",
      merge: (persisted, current) => {
        const state = persisted as CartState | undefined;
        if (!state?.lines) return current;
        return {
          ...current,
          ...state,
          lines: state.lines.map((l) =>
            normalizeLine({ ...(l as CartLine), kind: (l as CartLine).kind ?? "product" })
          ),
        };
      },
    }
  )
);

export function cartLineKey(line: CartLine): string {
  return lineKey(normalizeLine(line));
}

export function isGiftCardLine(line: CartLine): boolean {
  return normalizeLine(line).kind === "gift_card";
}

export function isGiftBasketLine(line: CartLine): boolean {
  return normalizeLine(line).kind === "gift_basket";
}

/** Lines that go through normal checkout (not WhatsApp gift baskets). */
export function isCheckoutLine(line: CartLine): boolean {
  return !isGiftBasketLine(normalizeLine(line));
}
