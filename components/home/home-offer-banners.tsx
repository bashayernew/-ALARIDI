"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";

export type OfferBannerDTO = {
  id: string;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  imageUrl: string;
  linkUrl: string;
};

type Props = {
  banners: OfferBannerDTO[];
};

export function HomeOfferBanners({ banners }: Props) {
  const { locale, dir, t } = useI18n();
  const [i, setI] = React.useState(0);
  const list = banners.filter((b) => b.titleEn || b.titleAr);

  const count = list.length;
  const idx = count > 0 ? ((i % count) + count) % count : 0;

  // Auto-advance through multiple offers.
  React.useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(() => setI((v) => v + 1), 6500);
    return () => clearInterval(id);
  }, [count]);

  if (count === 0) return null;

  const b = list[idx];
  const title = locale === "ar" ? b.titleAr || b.titleEn : b.titleEn || b.titleAr;
  const subtitle =
    locale === "ar" ? b.subtitleAr || b.subtitleEn : b.subtitleEn || b.subtitleAr;
  const hasImage = Boolean(b.imageUrl?.trim());
  const href = b.linkUrl?.trim() || "/menu";

  return (
    <section className="px-4 py-8 sm:px-6 sm:py-12 md:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="surface-card lift hover:lift-hover group relative overflow-hidden rounded-[1.75rem] border-primary/20">
          {/* Ambient gold glow */}
          <div
            aria-hidden
            className="glow-radial pointer-events-none absolute inset-x-0 -top-1/2 h-full"
          />

          <div
            className={cn(
              "relative grid items-stretch",
              hasImage ? "lg:grid-cols-[1.1fr_1fr]" : "lg:grid-cols-1"
            )}
          >
            {/* Image */}
            {hasImage && (
              <div className="relative min-h-[240px] overflow-hidden sm:min-h-[320px] lg:min-h-[400px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, scale: 1.06 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={b.imageUrl}
                      alt={title}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      sizes="(max-width:1024px) 100vw, 640px"
                    />
                  </motion.div>
                </AnimatePresence>
                {/* Soft vignette for depth */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent"
                />
              </div>
            )}

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-center gap-4 p-5 sm:gap-5 sm:p-10 lg:p-12">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-primary backdrop-blur-sm">
                <Sparkles className="size-3.5" />
                {t("home.offer.kicker")}
              </span>

              <AnimatePresence mode="wait">
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-3"
                >
                  <h2 className="font-heading text-2xl leading-[1.12] text-balance sm:text-3xl md:text-4xl lg:text-5xl">
                    {title}
                  </h2>
                  {subtitle ? (
                    <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {subtitle}
                    </p>
                  ) : null}
                  <div
                    aria-hidden
                    className="mt-1 h-px w-20 bg-gradient-to-r from-primary/60 to-transparent"
                  />
                </motion.div>
              </AnimatePresence>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <Link
                  href={href}
                  className="gold-glow group/cta inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:brightness-105"
                >
                  {t("hero.cta.order")}
                  <ArrowRight
                    className={cn(
                      "size-4 transition-transform duration-300 group-hover/cta:translate-x-0.5",
                      dir === "rtl" && "rotate-180 group-hover/cta:-translate-x-0.5"
                    )}
                  />
                </Link>

                {count > 1 && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      {list.map((item, n) => (
                        <button
                          key={item.id}
                          type="button"
                          aria-label={`Go to offer ${n + 1}`}
                          onClick={() => setI(n)}
                          className={cn(
                            "h-2 rounded-full transition-all duration-300",
                            n === idx
                              ? "w-6 bg-primary"
                              : "w-2 bg-primary/30 hover:bg-primary/50"
                          )}
                        />
                      ))}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="size-8 rounded-full border-primary/30"
                        aria-label="Previous offer"
                        onClick={() => setI((v) => v - 1)}
                      >
                        <ChevronLeft
                          className={cn("size-4", dir === "rtl" && "rotate-180")}
                        />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="size-8 rounded-full border-primary/30"
                        aria-label="Next offer"
                        onClick={() => setI((v) => v + 1)}
                      >
                        <ChevronRight
                          className={cn("size-4", dir === "rtl" && "rotate-180")}
                        />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
