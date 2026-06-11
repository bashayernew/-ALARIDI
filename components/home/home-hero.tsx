"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/i18n-provider";
import { useHeaderOffers } from "@/components/header-offers/header-offers-provider";
import { HeaderOfferIcon } from "@/lib/header-offer-icons";

// Authentic in-house product photo (pistachio baklava platter on a dark ground).
const heroImage = "/mixedbaklawa.jpg";

export function HomeHero() {
  const { t, dir } = useI18n();
  const { HERO_BADGE: heroBadges } = useHeaderOffers();
  const heroBadge = heroBadges[0];
  const ref = React.useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.02, 1.12]);

  return (
    <section
      ref={ref}
      className="relative isolate min-h-[86vh] overflow-hidden bg-[#1a130b] sm:min-h-[90vh]"
    >
      {/* Vivid full-bleed product photo */}
      <motion.div
        className="absolute inset-0 will-change-transform"
        style={{ y: imageY, scale: imageScale }}
      >
        <Image
          src={heroImage}
          alt={t("hero.title.before")}
          fill
          priority
          className="object-cover object-center brightness-[0.92]"
          sizes="100vw"
        />
      </motion.div>

      {/* Legibility scrim — darker on the text side, light on the image side */}
      <div
        aria-hidden
        className={cn(
          "absolute inset-0",
          dir === "rtl"
            ? "bg-gradient-to-l from-black/85 via-black/45 to-black/10"
            : "bg-gradient-to-r from-black/85 via-black/45 to-black/10"
        )}
      />
      {/* Vertical depth + vignette */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30"
      />
      {/* Soft handoff into the cream page below */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background to-transparent"
      />
      {/* Ambient gold glow */}
      <div
        aria-hidden
        className="glow-radial pointer-events-none absolute inset-x-0 -top-1/3 z-0 h-2/3"
      />

      <div className="relative mx-auto flex min-h-[86vh] max-w-6xl flex-col justify-center gap-8 px-4 pb-24 pt-32 sm:min-h-[90vh] sm:px-6 sm:pb-28 sm:pt-36">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl space-y-6 text-start"
        >
          {heroBadge ? (
            <div className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-md">
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
              {heroBadge.ctaLink?.trim() && heroBadge.ctaText?.trim() ? (
                <Link
                  href={heroBadge.ctaLink}
                  className="text-[11px] font-semibold text-primary underline-offset-2 hover:underline"
                >
                  {heroBadge.ctaText}
                </Link>
              ) : null}
            </div>
          ) : null}

          <h1 className="font-heading text-[3rem] font-medium leading-[1.04] text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.45)] sm:text-6xl md:text-[5.25rem]">
            {t("hero.title.before")}{" "}
            <span className="text-gradient-gold italic">
              {t("hero.title.highlight")}
            </span>
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-white/80 drop-shadow-[0_1px_12px_rgba(0,0,0,0.4)] sm:text-lg">
            {t("hero.subtitle")}
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/menu"
              className={cn(
                buttonVariants({ size: "lg" }),
                "gold-glow inline-flex gap-2 rounded-2xl px-8 text-base shadow-lg"
              )}
            >
              {t("hero.cta.order")}
              <ArrowRight
                className={cn("size-4", dir === "rtl" && "rotate-180")}
              />
            </Link>
            <Link
              href="/menu"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "rounded-2xl border-white/30 bg-white/10 px-8 text-base text-white backdrop-blur-md hover:bg-white/20"
              )}
            >
              {t("hero.cta.browse")}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
