"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X } from "lucide-react";
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
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);
  React.useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);
  React.useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  if (pathname?.startsWith("/admin/login")) {
    return <>{children}</>;
  }

  const isSuper = session?.role === "SUPER_ADMIN";
  const isSales = session?.role === "BRANCH_SALES";

  // Branch-sales staff only manage orders + per-branch menu availability.
  const navItems: { href: string; label: string }[] = isSales
    ? [
        { href: "/admin", label: t("admin.nav.orders") },
        { href: "/admin/availability", label: t("admin.nav.availability") },
      ]
    : [
        { href: "/admin/availability", label: t("admin.nav.availability") },
        { href: "/admin/delivery-areas", label: t("admin.nav.deliveryAreas") },
        ...BASE_LINKS.map((l) => ({ href: l.href, label: t(l.labelKey) })),
      ];
  if (isSuper) {
    navItems.push({ href: "/admin/accounts", label: "Accounts" });
    navItems.push({ href: "/admin/features", label: "Store features" });
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Menu"
              className="inline-flex size-9 items-center justify-center rounded-lg text-foreground transition hover:text-primary"
            >
              <Menu className="size-6" />
            </button>
            <p className="font-heading text-foreground">Admin</p>
          </div>
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
        {children}

        {/* Mobile side-drawer navigation */}
        {mounted &&
          createPortal(
            <div
              className={cn(
                "fixed inset-0 z-[100] md:hidden",
                menuOpen ? "" : "pointer-events-none"
              )}
            >
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
                  menuOpen ? "opacity-100" : "opacity-0"
                )}
              />
              <aside
                className={cn(
                  "absolute inset-y-0 start-0 flex w-[80%] max-w-xs flex-col overflow-y-auto border-e border-border bg-sidebar px-3 py-5 shadow-2xl transition-transform duration-300 ease-out",
                  menuOpen
                    ? "translate-x-0"
                    : "-translate-x-full rtl:translate-x-full"
                )}
              >
                <div className="flex items-center justify-between px-1">
                  <div className="leading-tight">
                    <p className="font-heading text-lg text-primary">Al Aridi</p>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/70">
                      Admin
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMenuOpen(false)}
                    aria-label="Close menu"
                    className="inline-flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <BranchSwitcher className="mt-5" />

                <nav className="mt-5 flex flex-1 flex-col gap-0.5">
                  {navItems.map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "rounded-lg px-3 py-2.5 text-sm transition-colors",
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
                  <div className="mt-3 border-t border-border pt-3">
                    <p className="truncate px-2 text-xs text-foreground">
                      {session.email}
                    </p>
                    <p className="px-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {isSuper ? "Super admin" : "Branch admin"}
                    </p>
                  </div>
                ) : null}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  disabled={busy}
                  onClick={() => void onLogout()}
                >
                  {t("admin.dashboard.signOut")}
                </Button>
              </aside>
            </div>,
            document.body
          )}
      </div>
    </div>
  );
}
