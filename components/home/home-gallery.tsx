"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { HomeFadeUp } from "@/components/home/home-fade-up";
import { useI18n } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";

// In-house product photography for the gallery row.
const SHOTS = [
  { src: "/baklawa.jpg", offset: "lg:mt-0" },
  { src: "/kunafa.jpg", offset: "lg:mt-10" },
  { src: "/maamoul.jpg", offset: "lg:mt-0" },
  { src: "/mafrooke.jpg", offset: "lg:mt-10" },
];

export function HomeGallery() {
  const { t } = useI18n();

  return (
    <section className="mx-auto max-w-6xl overflow-x-clip px-4 py-12 sm:px-6 sm:py-16 md:py-24">
      <HomeFadeUp>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">
            {t("home.gallery.kicker")}
          </p>
          <h2 className="mt-4 font-heading text-2xl leading-[1.15] text-balance sm:text-3xl md:text-4xl lg:text-5xl">
            {t("home.gallery.quote")}
          </h2>
        </div>
      </HomeFadeUp>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:mt-14 sm:gap-5 md:gap-6 lg:grid-cols-4">
        {SHOTS.map((shot, i) => (
          <motion.figure
            key={shot.src}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              duration: 0.55,
              delay: i * 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={`group relative ${shot.offset}`}
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image
                src={shot.src}
                alt=""
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                sizes="(max-width:1024px) 50vw, 25vw"
              />
            </div>
            {/* Tilted gold frame — straightens on hover */}
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute -inset-1 border border-primary/45 transition-transform duration-500 ease-out group-hover:rotate-0 sm:-inset-2.5",
                i % 2 === 0 ? "rotate-[5deg]" : "-rotate-[5deg]"
              )}
            />
          </motion.figure>
        ))}
      </div>
    </section>
  );
}
