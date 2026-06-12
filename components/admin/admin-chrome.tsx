"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/i18n-provider";
import { adminLogout } from "@/actions/admin-auth";
import { setActiveBranch } from "@/actions/admin-branch";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { TranslationKey } from "@/lib/dictionary";
import type { AdminSession } from "@/lib/admin-session";
import type { BranchDTO } from "@/lib/branches";
import { ALL_BRANCHES } from "@/lib/branch-scope";

const BASE_LINKS: { href: string; labelKey: TranslationKey }[] = [
  { href: "/admin", labelKey: "admin.nav.orders" },
  { href: "/admin/products", labelKey: "admin.nav.products" },
  { href: "/admin/promos", labelKey: "admin.nav.promos" },
  { href: "/admin/gift-cards", labelKey: "admin.nav.giftCards" },
  { href: "/admin/gift-baskets", labelKey: "admin.nav.giftBaskets" },
  { href: "/admin/occasions", labelKey: "admin.nav.occasions" },
  { href: "/admin/loyalty", labelKey: "admin.nav.loyalty" },
  { href: "/admin/banners", labelKey: "admin.nav.banners" },
  { href: "/admin/header-offers", labelKey: "admin.nav.headerOffers" },
  { href: "/admin/branch-whatsapp", labelKey: "admin.nav.branchWhatsapp" },
  { href: "/admin/users", labelKey: "admin.nav.users" },
  { href: "/admin/contact", labelKey: "admin.nav.contact" },
];

type Props = {
  children: React.ReactNode;
  session: AdminSession | null;
  branches: BranchDTO[];
  activeBranchId: string | null;
};

export function AdminChrome({
  children,
  session,
  branches,
  activeBranchId,
}: Props) {
  const pathname = usePathname();
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  if (pathname?.startsWith("/admin/login")) {
    return <>{children}</>;
  }

  const isSuper = session?.role === "SUPER_ADMIN";

  const navItems: { href: string; label: string }[] = [
    { href: "/admin/availability", label: t("admin.nav.availability") },
    { href: "/admin/delivery-areas", label: t("admin.nav.deliveryAreas") },
    ...BASE_LINKS.map((l) => ({ href: l.href, label: t(l.labelKey) })),
  ];
  if (isSuper) {
    navItems.push({ href: "/admin/accounts", label: "Accounts" });
  }
  navItems.sort((a, b) =>
    a.href === "/admin" ? -1 : b.href === "/admin" ? 1 : 0
  );

  async function onLogout() {
    setBusy(true);
    await adminLogout();
    router.push("/admin/login");
    router.refresh();
    setBusy(false);
  }

  async function onBranchChange(id: string) {
    await setActiveBranch(id);
    router.refresh();
  }

  const activeBranch = branches.find((b) => b.id === activeBranchId) ?? null;

  function BranchSwitcher({ className }: { className?: string }) {
    if (!session || branches.length === 0) return null;
    return (
      <div className={cn("space-y-1", className)}>
        <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Branch
        </p>
        {isSuper ? (
          <>
            <select
              value={activeBranchId ?? ""}
              onChange={(e) => void onBranchChange(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-2 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none"
              aria-label="Active branch"
            >
              <option value={ALL_BRANCHES}>All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            {activeBranchId === ALL_BRANCHES ? (
              <p className="px-1 text-[10px] leading-tight text-primary">
                Changes to availability, pricing and delivery areas apply to
                every branch.
              </p>
            ) : null}
          </>
        ) : (
          <div className="rounded-lg border border-border bg-muted px-2 py-2 text-sm text-foreground">
            {activeBranch?.name ?? "—"}
          </div>
        )}
      </div>
    );
  }

  function isActive(href: string) {
    return href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname?.startsWith(`${href}/`);
  }

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-e border-border bg-sidebar px-3 py-6 md:flex">
        <p className="px-2 font-heading text-lg tracking-tight text-primary">
          Al Aridi
        </p>
        <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/70">
          Admin
        </p>

        <BranchSwitcher className="mt-5" />

        <nav className="mt-6 flex flex-1 flex-col gap-0.5 overflow-y-auto">
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-lg px-2 py-2 text-sm transition-colors",
                isActive(href)
                  ? "bg-primary/15 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {session ? (
          <div className="mt-4 border-t border-border pt-3">
            <p className="truncate px-2 text-xs text-foreground">
              {session.email}
            </p>
            <p className="px-2 text-[10px] uppercase tracking-wide text-muted-foreground">
              {isSuper ? "Super admin" : "Branch admin"}
            </p>
          </div>
        ) : null}

        <div className="mt-3 flex items-center gap-2">
          <ThemeToggle />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex-1 justify-start text-muted-foreground hover:text-foreground"
            disabled={busy}
            onClick={() => void onLogout()}
          >
            {t("admin.dashboard.signOut")}
          </Button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:hidden">
          <p className="font-heading text-foreground">Admin</p>
          <div className="flex items-center gap-2">
            {session && branches.length > 0 && isSuper ? (
              <select
                value={activeBranchId ?? ""}
                onChange={(e) => void onBranchChange(e.target.value)}
                className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                aria-label="Active branch"
              >
                <option value={ALL_BRANCHES}>All branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            ) : null}
            <ThemeToggle />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => void onLogout()}
            >
              {t("admin.dashboard.signOut")}
            </Button>
          </div>
        </header>
        <div className="md:hidden">
          <nav className="flex gap-1 overflow-x-auto border-b border-border px-2 py-2">
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs",
                  isActive(href)
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        {children}
      </div>
    </div>
  );
}
