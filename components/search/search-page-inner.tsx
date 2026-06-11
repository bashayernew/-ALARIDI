"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { MenuSection, MenuProduct } from "@/lib/menu-data";
import { displayMenuProduct } from "@/lib/menu-display";
import { MenuProductCard } from "@/components/menu/menu-product-card";
import { ProductDetailDialog } from "@/components/product/product-detail-dialog";
import { menuProductToDTO } from "@/lib/menu-mapper";
import type { ProductDTO } from "@/types";

export function SearchPageInner({ sections }: { sections: MenuSection[] }) {
  const { t, locale } = useI18n();
  const [query, setQuery] = React.useState("");
  const allProducts = React.useMemo(
    () => sections.flatMap((s) => s.products),
    [sections]
  );

  const results = React.useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return allProducts;
    return allProducts.filter((p) => {
      const d = displayMenuProduct(p, locale);
      return (
        d.name.toLowerCase().includes(term) ||
        d.description.toLowerCase().includes(term)
      );
    });
  }, [query, allProducts, locale]);

  const [dialogProduct, setDialogProduct] = React.useState<ProductDTO | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogKey, setDialogKey] = React.useState(0);

  function openDetail(p: MenuProduct) {
    setDialogProduct(menuProductToDTO(p));
    setDialogKey((k) => k + 1);
    setDialogOpen(true);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-heading text-3xl text-foreground sm:text-4xl">
        {t("nav.search")}
      </h1>

      <div className="relative mt-6">
        <Search className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search.placeholder")}
          className="w-full rounded-2xl border border-border bg-card py-4 pe-4 ps-12 text-base text-foreground shadow-sm outline-none transition focus:border-primary/50"
          aria-label={t("nav.search")}
        />
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        {t("search.count", { count: results.length })}
      </p>

      {results.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">
          {t("search.empty")}
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {results.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.2) }}
            >
              <MenuProductCard
                product={p}
                onOpen={openDetail}
                onCustomize={openDetail}
              />
            </motion.div>
          ))}
        </div>
      )}

      <ProductDetailDialog
        key={dialogKey}
        product={dialogProduct}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
