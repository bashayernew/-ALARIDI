"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductImage } from "@/components/ui/product-image";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ProductDTO } from "@/types";
import { formatKwd, discountPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  product: ProductDTO;
  rank?: number;
  /** Optional handler for opening a quick-view dialog. If not provided, the
   *  card links to the product's detail page instead. */
  onOpen?: (p: ProductDTO) => void;
};

export function ProductCard({ product, rank, onOpen }: Props) {
  const router = useRouter();
  const hasDiscount =
    product.oldPrice != null && product.oldPrice > product.price;
  const pct = hasDiscount
    ? discountPercent(product.price, product.oldPrice!)
    : 0;

  function handleAction() {
    if (onOpen) {
      onOpen(product);
    } else {
      router.push(`/product/${product.slug}`);
    }
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group relative flex flex-row-reverse gap-4 overflow-hidden rounded-2xl border border-border/60 bg-card/50 p-4 shadow-sm transition hover:border-primary/35 hover:shadow-[0_0_0_1px_rgba(201,169,110,0.12),0_24px_60px_-28px_rgba(0,0,0,0.75)] sm:p-5"
      )}
    >
      {rank != null && rank <= 2 && (
        <div className="absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-primary/40 bg-background/90 text-xs font-bold text-primary shadow-md backdrop-blur">
          #{rank}
        </div>
      )}
      <Link
        href={`/product/${product.slug}`}
        className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-32 sm:w-32"
      >
        <ProductImage
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width:640px)112px,128px"
          fallbackTextClassName="text-xs"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {product.isBestSeller && (
            <Badge
              variant="secondary"
              className="border border-primary/25 bg-primary/10 text-[10px] uppercase tracking-wide text-primary"
            >
              Best seller
            </Badge>
          )}
          {product.isNew && (
            <Badge
              variant="secondary"
              className="border border-emerald-500/25 bg-emerald-500/10 text-[10px] uppercase tracking-wide text-emerald-600 dark:text-emerald-300"
            >
              New
            </Badge>
          )}
          {hasDiscount && (
            <Badge className="bg-destructive/15 text-[10px] font-semibold text-destructive">
              −{pct}%
            </Badge>
          )}
          {product.isCustomizable && (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              Customizable
            </Badge>
          )}
        </div>
        <h3 className="font-sans text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-2xl">
          <Link href={`/product/${product.slug}`} className="hover:text-primary">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1.5 line-clamp-2 text-base leading-relaxed text-muted-foreground">
          {product.description}
        </p>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-2">
              <span className="font-sans text-base font-semibold text-primary tabular-nums sm:text-lg">
                {formatKwd(product.price)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through tabular-nums">
                  {formatKwd(product.oldPrice!)}
                </span>
              )}
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            className="min-h-11 shrink-0 gap-1 rounded-xl px-4"
            onClick={handleAction}
          >
            <Sparkles className="size-3.5 opacity-80" />
            Add
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
