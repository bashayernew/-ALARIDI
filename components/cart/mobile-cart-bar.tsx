"use client";

import { ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { cartSubtotal } from "@/lib/cart-totals";
import { formatKwd } from "@/lib/format";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/i18n-provider";

export function MobileCartBar() {
  const { t } = useI18n();
  const pathname = usePathname();
  const lines = useCartStore((s) => s.lines);
  const setOpen = useCartStore((s) => s.setOpen);
  const subtotal = cartSubtotal(lines);
  const count = lines.reduce((n, l) => n + l.quantity, 0);

  if (pathname?.startsWith("/checkout") || pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={count > 0 ? "full" : "empty"}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        >
          <Button
            type="button"
            variant={count > 0 ? "default" : "outline"}
            className={cn(
              "h-12 w-full justify-between gap-3 rounded-2xl px-4 text-base shadow-2xl",
              count > 0 && "gold-glow"
            )}
            onClick={() => setOpen(true)}
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="size-5" />
              {t("cart.mobile.view")}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                  count > 0
                    ? "bg-primary-foreground/15"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {count}
              </span>
            </span>
            <span
              className={cn(
                "tabular-nums font-semibold",
                count === 0 && "text-muted-foreground"
              )}
            >
              {count > 0 ? formatKwd(subtotal) : t("cart.mobile.tap")}
            </span>
          </Button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
