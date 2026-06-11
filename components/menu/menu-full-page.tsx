"use client";

import * as React from "react";
import { motion } from "framer-motion";
import type { MenuProduct } from "@/lib/menu-data";
import { MenuProductCard } from "@/components/menu/menu-product-card";
import { ProductDetailDialog } from "@/components/product/product-detail-dialog";
import { menuProductToDTO } from "@/lib/menu-mapper";
import type { ProductDTO } from "@/types";
import { cn } from "@/lib/utils";
import { HorizontalScrollHints } from "@/components/ui/horizontal-scroll-hints";
import { HomeFadeUp } from "@/components/home/home-fade-up";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { MenuSection } from "@/lib/menu-data";

export function MenuFullPage({
  initialSections,
}: {
  initialSections: MenuSection[];
}) {
  const { t } = useI18n();
  const sections = initialSections;

  const [maxPrice, setMaxPrice] = React.useState<number>(50);
  const [dietary, setDietary] = React.useState<string>("all");
  const [sortBy, setSortBy] = React.useState<
    "popularity" | "price-asc" | "price-desc" | "newest"
  >("popularity");

  const filterProducts = React.useCallback(
    (products: MenuProduct[]) => {
      const filtered = products.filter((p) => {
        if (p.price > maxPrice) return false;
        if (
          dietary !== "all" &&
          !(p.dietary ?? []).includes(
            dietary as "sugar-free" | "vegan" | "gluten-free"
          )
        ) {
          return false;
        }
        return true;
      });

      return filtered.sort((a, b) => {
        if (sortBy === "price-asc") return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        if (sortBy === "newest")
          return Number(Boolean(b.isNew)) - Number(Boolean(a.isNew));
        return Number(Boolean(b.bestSeller)) - Number(Boolean(a.bestSeller));
      });
    },
    [maxPrice, dietary, sortBy]
  );

  const visibleSections = React.useMemo(
    () =>
      sections
        .map((section) => ({
          ...section,
          filteredProducts: filterProducts(section.products),
        }))
        .filter((section) => section.filteredProducts.length > 0),
    [sections, filterProducts]
  );

  const [activeSlug, setActiveSlug] = React.useState(
    () => sections[0]?.slug ?? ""
  );

  React.useEffect(() => {
    setActiveSlug((prev) =>
      sections.some((s) => s.slug === prev) ? prev : (sections[0]?.slug ?? "")
    );
  }, [sections]);
  const [dialogProduct, setDialogProduct] = React.useState<ProductDTO | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogKey, setDialogKey] = React.useState(0);

  const scrollTo = React.useCallback((slug: string) => {
    setActiveSlug(slug);
    document
      .getElementById(`menu-cat-${slug}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  React.useEffect(() => {
    const nodes = visibleSections
      .map((s) => document.getElementById(`menu-cat-${s.slug}`))
      .filter(Boolean) as HTMLElement[];

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id?.startsWith("menu-cat-")) {
          const slug = visible.target.id.replace("menu-cat-", "");
          setActiveSlug(slug);
        }
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: [0, 0.1, 0.25] }
    );

    nodes.forEach((n) => obs.observe(n));
    return () => obs.disconnect();
  }, [visibleSections]);

  function openCustomize(p: MenuProduct) {
    setDialogProduct(menuProductToDTO(p));
    setDialogKey((k) => k + 1);
    setDialogOpen(true);
  }

  // Open the full product card for any product (triggered by clicking the card).
  function openDetail(p: MenuProduct) {
    setDialogProduct(menuProductToDTO(p));
    setDialogKey((k) => k + 1);
    setDialogOpen(true);
  }

  return (
    <div className="bg-background pb-14 pt-6 sm:pb-16 sm:pt-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <HomeFadeUp>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            Al Aridi Sweets
          </p>
          <h1 className="mt-3 font-heading text-4xl tracking-tight text-foreground sm:text-5xl">
            {t("menu.title")}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("menu.subtitle")}
          </p>
        </HomeFadeUp>
      </div>

      <div className="sticky top-16 z-40 mt-8 border-y border-primary/[0.08] bg-background/92 backdrop-blur-xl supports-[backdrop-filter]:bg-background/85">
        <div className="mx-auto w-full min-w-0 max-w-6xl px-4 sm:px-6">
        <HorizontalScrollHints
          className="min-w-0"
          scrollerClassName="flex gap-2 py-3"
          edgeFadeClassName="from-background/95 via-background/55"
        >
          {sections.map((s) => (
            <button
              key={s.slug}
              type="button"
              onClick={() => scrollTo(s.slug)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-[0.15em] transition-all duration-300 sm:text-[13px]",
                activeSlug === s.slug
                  ? "border-primary/55 bg-primary/15 text-primary gold-glow"
                  : "border-border bg-card text-muted-foreground hover:border-primary/35 hover:text-foreground"
              )}
            >
              {s.label}
            </button>
          ))}
        </HorizontalScrollHints>
        </div>
        <div className="mx-auto grid max-w-6xl gap-2 px-4 pb-3 sm:grid-cols-4 sm:px-6">
          <label className="text-xs text-muted-foreground">
            {t("menu.filter.maxPrice")}
            <input
              type="range"
              min={1}
              max={50}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="mt-1 w-full"
            />
          </label>
          <label className="text-xs text-muted-foreground">
            {t("menu.filter.dietary")}
            <select
              value={dietary}
              onChange={(e) => setDietary(e.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-border/60 bg-card px-2"
            >
              <option value="all">{t("menu.filter.dietary.all")}</option>
              <option value="sugar-free">
                {t("menu.filter.dietary.sugarFree")}
              </option>
              <option value="vegan">{t("menu.filter.dietary.vegan")}</option>
              <option value="gluten-free">
                {t("menu.filter.dietary.glutenFree")}
              </option>
            </select>
          </label>
          <label className="text-xs text-muted-foreground sm:col-span-2">
            {t("menu.filter.sort")}
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as
                    | "popularity"
                    | "price-asc"
                    | "price-desc"
                    | "newest"
                )
              }
              className="mt-1 h-9 w-full rounded-lg border border-border/60 bg-card px-2"
            >
              <option value="popularity">{t("menu.sort.popularity")}</option>
              <option value="price-asc">{t("menu.sort.priceAsc")}</option>
              <option value="price-desc">{t("menu.sort.priceDesc")}</option>
              <option value="newest">{t("menu.sort.newest")}</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-16 px-4 py-12 sm:space-y-20 sm:px-6 sm:py-14">
        {visibleSections.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {t("menu.noFilterResults")}
          </p>
        ) : null}
        {visibleSections.map((section) => (
          <motion.section
            key={section.slug}
            id={`menu-cat-${section.slug}`}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            className="scroll-mt-[7.5rem] sm:scroll-mt-[8rem]"
          >
            <div className="mb-8 flex flex-col gap-2 border-b border-primary/[0.1] pb-6">
              <h2 className="font-heading text-3xl text-foreground sm:text-4xl">
                {section.label}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("menu.itemsCount", {
                  count: section.filteredProducts.length,
                })}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {section.filteredProducts.map((p, pi) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(pi * 0.04, 0.24) }}
                >
                  <MenuProductCard
                    product={p}
                    onCustomize={openCustomize}
                    onOpen={openDetail}
                  />
                </motion.div>
              ))}
            </div>
          </motion.section>
        ))}
      </div>

      <ProductDetailDialog
        key={dialogKey}
        product={dialogProduct}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
