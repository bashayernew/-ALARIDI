"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/i18n-provider";
import { useHeaderOffers } from "@/components/header-offers/header-offers-provider";
import { HeaderOfferIcon } from "@/lib/header-offer-icons";

// Rotating hero slides — in-house product photography.
const SLIDES = [
  "/mixedbaklawa.jpg",
  "/kunafa.jpg",
  "/baklawa.jpg",
  "/maamoul.jpg",
  "/assorted.jpg",
];

const AUTOPLAY_MS = 6000;

export function HomeHero() {
  const { t, dir } = useI18n();
  const { HERO_BADGE: heroBadges } = useHeaderOffers();
  const heroBadge = heroBadges[0];

  const count = SLIDES.length;
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  const go = React.useCallback(
    (step: number) => setIndex((i) => (i + step + count) % count),
    [count]
  );

  // Auto-advance the carousel.
  React.useEffect(() => {
    if (paused) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % count),
      AUTOPLAY_MS
    );
    return () => window.clearInterval(id);
  }, [count, paused]);

  return (
    <section
      className="relative isolate min-h-[82vh] max-w-full overflow-hidden bg-[#140d06] sm:min-h-[88vh] md:-ms-[4.25rem] md:min-h-[92vh] md:w-[calc(100%_+_4.25rem)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Rotating full-bleed photography with crossfade + slow zoom */}
      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          className="absolute inset-0 will-change-transform"
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1.14 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 1.1, ease: "easeInOut" },
            scale: { duration: AUTOPLAY_MS / 1000 + 1.1, ease: "linear" },
          }}
        >
          <Image
            src={SLIDES[index]}
            alt={t("hero.title.before")}
            fill
            priority={index === 0}
            className="object-cover object-center"
            sizes="100vw"
          />
        </motion.div>
      </AnimatePresence>

      {/* Legibility scrims — centered vignette so the headline pops */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-[#140d06]/55 via-[#140d06]/15 to-[#140d06]/65"
      />
      {/* Darken behind the centered text; edges stay bright */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(62%_56%_at_50%_54%,rgba(8,5,2,0.72),transparent_72%)]"
      />
      {/* Soft handoff into the page below */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-background via-background/60 to-transparent"
      />

      {/* Centered content */}
      <div className="relative mx-auto flex min-h-[82vh] max-w-4xl flex-col items-center justify-center gap-5 px-5 pb-28 pt-36 text-center sm:min-h-[88vh] sm:gap-6 sm:px-6 sm:pb-24 sm:pt-48 md:min-h-[92vh] md:pt-56">
        {heroBadge ? (
          <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-md">
            <HeaderOfferIcon
              name={heroBadge.icon}
              className="size-3.5 shrink-0 text-primary"
            />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white">
              {heroBadge.title}
            </span>
            {heroBadge.shortText ? (
              <span className="text-[11px] text-white/70">
                · {heroBadge.shortText}
              </span>
            ) : null}
          </div>
        ) : null}

        {/* Elegant gold ornament */}
        <div className="flex items-center gap-3" aria-hidden>
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#e7c87f]" />
          <span className="size-1.5 rotate-45 bg-[#e7c87f]" />
          <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#e7c87f]" />
        </div>

        <h1 className="max-w-[18ch] font-heading text-[1.85rem] font-medium leading-[1.08] text-white [text-shadow:0_2px_30px_rgba(0,0,0,0.85),0_1px_4px_rgba(0,0,0,0.7)] sm:max-w-none sm:text-5xl sm:leading-[1.05] md:text-[5rem]">
          {t("hero.title.before")}
          <br />
          <span className="italic text-white">
            {t("hero.title.highlight")}
          </span>
        </h1>

        <p className="max-w-xl text-sm leading-relaxed text-white/90 [text-shadow:0_1px_16px_rgba(0,0,0,0.8)] sm:text-base md:text-lg">
          {t("hero.subtitle")}
        </p>

        <div className="flex w-full max-w-sm flex-col items-stretch gap-3 pt-2 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
          <Link
            href="/menu"
            className={cn(
              buttonVariants({ size: "lg" }),
              "gold-glow inline-flex w-full justify-center gap-2 rounded-2xl px-8 text-base shadow-lg sm:w-auto"
            )}
          >
            {t("hero.cta.order")}
            <ArrowRight className={cn("size-4", dir === "rtl" && "rotate-180")} />
          </Link>
        </div>
      </div>

      {/* Prev / Next arrows */}
      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="Previous slide"
        className="group absolute start-3 top-[62%] z-20 hidden min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/20 p-2.5 text-white/80 backdrop-blur-md transition hover:border-primary/60 hover:text-white sm:start-6 sm:top-1/2 sm:flex sm:p-3"
      >
        <ChevronLeft className="size-5 sm:size-6 rtl:rotate-180" />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="Next slide"
        className="group absolute end-3 top-[62%] z-20 hidden min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/20 p-2.5 text-white/80 backdrop-blur-md transition hover:border-primary/60 hover:text-white sm:end-6 sm:top-1/2 sm:flex sm:p-3"
      >
        <ChevronRight className="size-5 sm:size-6 rtl:rotate-180" />
      </button>

      {/* Slide dots */}
      <div className="absolute inset-x-0 bottom-6 z-20 flex justify-center gap-2 pb-[env(safe-area-inset-bottom,0px)] sm:bottom-9">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === index
                ? "w-7 bg-primary"
                : "w-1.5 bg-white/45 hover:bg-white/70"
            )}
          />
        ))}
      </div>
    </section>
  );
}
