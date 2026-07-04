"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Positions the whole header stack (announcement bar + main header).
 * - Homepage: floats transparently over the hero as one unit (not sticky).
 * - Everywhere else: a sticky bar that auto-hides on scroll-down and
 *   reappears on scroll-up, so it doesn't eat screen space on mobile.
 */
export function HeaderOverlay({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const overlay = pathname === "/";
  const [hidden, setHidden] = React.useState(false);

  React.useEffect(() => {
    if (overlay) return; // only auto-hide the sticky (inner-page) header
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y > last && y > 140) setHidden(true); // scrolling down
        else if (y < last - 4) setHidden(false); // scrolling up
        last = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overlay]);

  return (
    <div
      className={cn(
        "z-50 max-w-full overflow-x-clip",
        overlay
          ? "absolute inset-x-0 top-0"
          : "sticky top-0 transition-transform duration-300 ease-out",
        !overlay && hidden && "-translate-y-full"
      )}
    >
      {children}
    </div>
  );
}
