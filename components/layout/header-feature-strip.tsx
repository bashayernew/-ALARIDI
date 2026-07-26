"use client";

import Link from "next/link";
import { useHeaderOffers } from "@/components/header-offers/header-offers-provider";
import { HeaderOfferIcon } from "@/lib/header-offer-icons";
import { cn } from "@/lib/utils";

export function HeaderFeatureStrip() {
  const { FEATURE_STRIP: offers } = useHeaderOffers();
  if (offers.length === 0) return null;

  return (
    <div className="border-b border-border/40 bg-background/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ul className="scrollbar-none flex items-stretch gap-2 py-2 sm:justify-center sm:gap-3">
          {offers.map((offer) => {
            const inner = (
              <>
                {offer.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={offer.image}
                    alt=""
                    className="size-5 shrink-0 rounded-full border border-primary/25 object-cover"
                  />
                ) : (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/5">
                    <HeaderOfferIcon
                      name={offer.icon}
                      className="size-3 text-primary"
                    />
                  </span>
                )}
                <span className="min-w-0 text-start">
                  <span className="block truncate text-[11px] font-medium text-foreground/95">
                    {offer.title}
                  </span>
                </span>
              </>
            );

            const className = cn(
              "flex min-h-9 w-full items-center gap-2 rounded-xl border border-border/50 bg-card/30 px-2.5 py-1.5 transition",
              "hover:border-primary/25 hover:bg-card/50"
            );

            if (offer.ctaLink?.trim()) {
              return (
                <li key={offer.id} className="min-w-0 flex-1 sm:max-w-[14rem]">
                  <Link href={offer.ctaLink} className={className}>
                    {inner}
                  </Link>
                </li>
              );
            }

            return (
              <li key={offer.id} className="min-w-0 flex-1 sm:max-w-[14rem]">
                <div className={className}>{inner}</div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
