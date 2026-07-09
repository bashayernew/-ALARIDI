"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/i18n-provider";
import { useHeaderOffers } from "@/components/header-offers/header-offers-provider";
import { HeaderOfferIcon } from "@/lib/header-offer-icons";

const ROTATE_MS = 7000;

export function HeaderAnnouncementBar() {
  const { dir } = useI18n();
  const { TOP_ANNOUNCEMENT: offers } = useHeaderOffers();
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    setIndex(0);
  }, [offers.length]);

  React.useEffect(() => {
    if (offers.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % offers.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [offers.length]);

  if (offers.length === 0) return null;

  const offer = offers[index]!;
  const Prev = dir === "rtl" ? ChevronRight : ChevronLeft;
  const Next = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <div
      className="relative border-b border-primary/20 bg-gradient-to-r from-primary/10 via-background to-primary/10"
      role="region"
      aria-label="Announcement"
    >
      <div className="mx-auto flex h-9 max-w-6xl items-center justify-center gap-2 px-10 sm:px-12">
        {offers.length > 1 ? (
          <button
            type="button"
            className="absolute start-2 rounded-md p-1 text-primary/70 transition hover:bg-primary/10 hover:text-primary"
            onClick={() =>
              setIndex((i) => (i - 1 + offers.length) % offers.length)
            }
            aria-label="Previous announcement"
          >
            <Prev className="size-3.5" />
          </button>
        ) : null}

        <div className="flex min-w-0 items-center justify-center gap-2 text-center">
          <HeaderOfferIcon
            name={offer.icon}
            className="size-3.5 shrink-0 text-primary"
          />
          <p className="truncate text-[11px] font-medium tracking-wide text-foreground/90 sm:text-xs">
            <span className="text-primary/90">{offer.title}</span>
            {offer.shortText ? (
              <span className="text-muted-foreground">
                {" "}
                · {offer.shortText}
              </span>
            ) : null}
          </p>
        </div>

        {offers.length > 1 ? (
          <button
            type="button"
            className="absolute end-2 rounded-md p-1 text-primary/70 transition hover:bg-primary/10 hover:text-primary"
            onClick={() => setIndex((i) => (i + 1) % offers.length)}
            aria-label="Next announcement"
          >
            <Next className="size-3.5" />
          </button>
        ) : null}
      </div>

      {offers.length > 1 ? (
        <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 pb-0.5">
          {offers.map((o, i) => (
            <span
              key={o.id}
              className={cn(
                "h-0.5 w-3 rounded-full transition-colors",
                i === index ? "bg-primary/80" : "bg-primary/20"
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
