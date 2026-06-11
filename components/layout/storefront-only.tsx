"use client";

import { usePathname } from "next/navigation";

/**
 * Renders the public storefront chrome (header, footer, cart, socials) only on
 * customer-facing pages. Hidden on /admin, which has its own layout.
 */
export function StorefrontOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <>{children}</>;
}
