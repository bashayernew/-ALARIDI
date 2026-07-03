"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Positions the whole header stack (announcement bar + main header).
 * - Homepage: floats transparently over the hero as one unit (not sticky).
 * - Everywhere else: a normal sticky bar.
 */
export function HeaderOverlay({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const overlay = pathname === "/";
  return (
    <div
      className={cn(
        "z-50 max-w-full overflow-x-clip",
        overlay ? "absolute inset-x-0 top-0" : "sticky top-0"
      )}
    >
      {children}
    </div>
  );
}
