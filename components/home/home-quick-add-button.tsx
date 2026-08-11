"use client";

import * as React from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart-store";
import { hasWeightSizes } from "@/lib/product-sizes";
import type { ProductDTO } from "@/types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/i18n-provider";
import { displayDbProduct } from "@/lib/db-product-ar";

type Props = {
  product: ProductDTO;
  className?: string;
  size?: "sm" | "default";
  label?: string;
};

export function HomeQuickAddButton({
  product,
  className,
  size = "default",
  label,
}: Props) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const addLine = useCartStore((s) => s.addLine);
  const [busy, setBusy] = React.useState(false);
  const d = displayDbProduct(product, locale);
  const btnLabel = label ?? t("menu.cta.add");

  function handleClick() {
    // Weight-priced sweets need a size choice first — go to the product page.
    if (hasWeightSizes(product)) {
      router.push(`/product/${product.slug}`);
      return;
    }
    setBusy(true);
    addLine({
      productId: product.id,
      name: d.name,
      image: product.image,
      price: product.price,
      quantity: 1,
      giftWrap: false,
      extraToppings: false,
    });
    toast.success(t("product.toast.added"), { description: d.name });
    window.setTimeout(() => setBusy(false), 450);
  }

  return (
    <Button
      type="button"
      size={size}
      className={cn("rounded-xl gap-1.5", className)}
      disabled={busy}
      onClick={handleClick}
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Plus className="size-4" />
      )}
      {btnLabel}
    </Button>
  );
}
