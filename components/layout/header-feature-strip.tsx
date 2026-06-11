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
        <ul className="scrollbar-none flex items-stretch gap-2 overflow-x-auto py-2.5 sm:justify-center sm:gap-3">
          {offers.map((offer) => {
            const inner = (
              <>
                {offer.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={offer.image}
                    alt=""
                    className="size-7 shrink-0 rounded-full border border-primary/25 object-cover"
                  />
                ) : (
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/5">
                    <HeaderOfferIcon
                      name={offer.icon}
                      className="size-3.5 text-primary"
                    />
                  </span>
                )}
                <span className="min-w-0 text-start">
                  <span className="block truncate text-xs font-medium text-foreground/95">
                    {offer.title}
                  </span>
                  {offer.shortText ? (
                    <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                      {offer.shortText}
                    </span>
                  ) : null}
                </span>
              </>
            );

            const className = cn(
              "flex min-w-[9.5rem] max-w-[14rem] shrink-0 items-center gap-2.5 rounded-xl border border-border/50 bg-card/30 px-3 py-2 transition",
              "hover:border-primary/25 hover:bg-card/50 sm:min-w-[10.5rem]"
            );

            if (offer.ctaLink?.trim()) {
              return (
                <li key={offer.id}>
                  <Link href={offer.ctaLink} className={className}>
                    {inner}
                  </Link>
                </li>
              );
            }

            return (
              <li key={offer.id}>
                <div className={className}>{inner}</div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
