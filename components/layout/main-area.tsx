"use client";

import { usePathname } from "next/navigation";

/**
 * The page <main>. On the storefront it leaves room for the floating socials
 * rail and the mobile cart bar; on /admin (its own layout) it uses no padding.
 */
export function MainArea({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  return (
    <main className={isAdmin ? "flex-1" : "flex-1 overflow-x-clip md:ps-[4.25rem]"}>
      {children}
    </main>
  );
}
