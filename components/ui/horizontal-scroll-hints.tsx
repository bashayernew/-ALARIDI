"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const SCROLL_EPS = 4;

function getHorizontalScrollEdges(el: HTMLElement) {
  const maxScroll = el.scrollWidth - el.clientWidth;
  if (maxScroll <= SCROLL_EPS) {
    return { atStart: true, atEnd: true };
  }

  const { scrollLeft } = el;
  const isRtl = getComputedStyle(el).direction === "rtl";

  if (!isRtl) {
    return {
      atStart: scrollLeft <= SCROLL_EPS,
      atEnd: scrollLeft >= maxScroll - SCROLL_EPS,
    };
  }

  if (scrollLeft < 0) {
    return {
      atStart: Math.abs(scrollLeft) <= SCROLL_EPS,
      atEnd: Math.abs(scrollLeft) >= maxScroll - SCROLL_EPS,
    };
  }

  return {
    atStart: scrollLeft >= maxScroll - SCROLL_EPS,
    atEnd: scrollLeft <= SCROLL_EPS,
  };
}

function scrollHorizontal(el: HTMLElement, toward: "start" | "end") {
  const amount = Math.round(el.clientWidth * 0.72);
  const isRtl = getComputedStyle(el).direction === "rtl";
  let left: number;

  if (toward === "start") {
    if (!isRtl) left = -amount;
    else if (el.scrollLeft < 0) left = amount;
    else left = -amount;
  } else {
    if (!isRtl) left = amount;
    else if (el.scrollLeft < 0) left = -amount;
    else left = amount;
  }

  el.scrollBy({ left, behavior: "smooth" });
}

type HorizontalScrollHintsProps = {
  children: React.ReactNode;
  className?: string;
  scrollerClassName?: string;
  /** Tailwind gradient classes for edge fades, e.g. `from-[#0b0b0b]/95 via-[#0b0b0b]/50` */
  edgeFadeClassName?: string;
};

export function HorizontalScrollHints({
  children,
  className,
  scrollerClassName,
  edgeFadeClassName = "from-background/95 via-background/55",
}: HorizontalScrollHintsProps) {
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollStart, setCanScrollStart] = React.useState(false);
  const [canScrollEnd, setCanScrollEnd] = React.useState(false);

  const updateScrollState = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { atStart, atEnd } = getHorizontalScrollEdges(el);
    setCanScrollStart(!atStart);
    setCanScrollEnd(!atEnd);
  }, []);

  React.useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const measure = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(updateScrollState);
      });
    };

    measure();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", measure, { passive: true });

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);

    const fontReady = document.fonts?.ready;
    if (fontReady) fontReady.then(measure).catch(() => undefined);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, [updateScrollState, children]);

  return (
    <div className={cn("relative w-full min-w-0", className)}>
      {canScrollStart ? (
        <>
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-y-0 start-0 z-10 w-12 bg-gradient-to-r to-transparent sm:w-16",
              edgeFadeClassName
            )}
          />
          <button
            type="button"
            aria-label="Scroll categories left"
            onClick={() => {
              const el = scrollerRef.current;
              if (el) scrollHorizontal(el, "start");
            }}
            className="absolute inset-y-0 start-0 z-20 flex w-12 items-center justify-center sm:w-16"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-background/35 text-primary/70 shadow-[0_0_12px_rgba(204,154,61,0.15)] backdrop-blur-[2px] transition-colors hover:bg-background/50 hover:text-primary sm:size-9">
              <ChevronLeft
                className="size-4 animate-scroll-hint-start sm:size-[18px] rtl:rotate-180"
                strokeWidth={2.5}
              />
            </span>
          </button>
        </>
      ) : null}

      {canScrollEnd ? (
        <>
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-y-0 end-0 z-10 w-12 bg-gradient-to-l to-transparent sm:w-16",
              edgeFadeClassName
            )}
          />
          <button
            type="button"
            aria-label="Scroll categories right"
            onClick={() => {
              const el = scrollerRef.current;
              if (el) scrollHorizontal(el, "end");
            }}
            className="absolute inset-y-0 end-0 z-20 flex w-12 items-center justify-center sm:w-16"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-background/35 text-primary/70 shadow-[0_0_12px_rgba(204,154,61,0.15)] backdrop-blur-[2px] transition-colors hover:bg-background/50 hover:text-primary sm:size-9">
              <ChevronRight
                className="size-4 animate-scroll-hint-end sm:size-[18px] rtl:rotate-180"
                strokeWidth={2.5}
              />
            </span>
          </button>
        </>
      ) : null}

      <div
        ref={scrollerRef}
        className={cn(
          "w-full min-w-0 overflow-x-auto scroll-smooth scrollbar-none",
          scrollerClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
