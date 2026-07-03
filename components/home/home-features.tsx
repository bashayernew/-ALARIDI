"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChefHat, Gift, Award, ArrowRight } from "lucide-react";
import { HomeFadeUp } from "@/components/home/home-fade-up";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { TranslationKey } from "@/lib/dictionary";

// The three feature points shown on the right, matching the Crems layout.
const FEATURES = [
  { icon: ChefHat, key: "f1" },
  { icon: Gift, key: "f4" },
  { icon: Award, key: "f3" },
] as const;

export function HomeFeatures() {
  const { t, dir } = useI18n();

  return (
    <section className="mx-auto max-w-6xl overflow-x-clip px-4 py-12 sm:px-6 sm:py-16 md:py-24">
      <div className="grid items-center gap-8 sm:gap-10 lg:grid-cols-3 lg:gap-8">
        {/* Left — intro */}
        <HomeFadeUp>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              {t("home.features.kicker")}
            </p>
            <h2 className="mt-4 font-heading text-2xl leading-[1.12] sm:text-3xl md:text-4xl">
              {t("home.features.headline")}{" "}
              <span className="italic text-primary">
                {t("home.features.headlineEm")}
              </span>{" "}
              {t("home.features.headlineRest")}
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              {t("home.features.body")}
            </p>
            <Link
              href="/menu"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "mt-7 gap-2 rounded-full border-primary/30"
              )}
            >
              {t("home.features.cta")}
              <ArrowRight
                className={cn("size-4", dir === "rtl" && "rotate-180")}
              />
            </Link>
          </div>
        </HomeFadeUp>

        {/* Center — product image */}
        <HomeFadeUp delay={0.08}>
          <motion.div
            initial={{ opacity: 0, scale: 1.05 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="group relative mx-auto aspect-square w-full max-w-sm"
          >
            <div className="relative h-full w-full overflow-hidden rounded-[1.5rem] border border-primary/15">
              <Image
                src="/assorted.jpg"
                alt={t("home.features.headlineEm")}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width:1024px) 80vw, 384px"
              />
            </div>
            {/* Tilted gold frame accent */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-1.5 -z-10 rotate-3 rounded-[1.5rem] border border-primary/25 sm:-inset-3"
            />
          </motion.div>
        </HomeFadeUp>

        {/* Right — features list */}
        <HomeFadeUp delay={0.16}>
          <ul className="space-y-9">
            {FEATURES.map(({ icon: Icon, key }) => (
              <li key={key} className="group flex items-start gap-4">
                <span className="mt-0.5 inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-primary/30 text-primary transition-all duration-300 group-hover:border-primary/60 group-hover:bg-primary/5">
                  <Icon className="size-6" strokeWidth={1.3} />
                </span>
                <div className="min-w-0">
                  <h3 className="font-heading text-lg text-foreground">
                    {t(`home.features.${key}.title` as TranslationKey)}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {t(`home.features.${key}.body` as TranslationKey)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </HomeFadeUp>
      </div>
    </section>
  );
}
