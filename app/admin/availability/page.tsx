import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import { listBranches, getActiveBranchId, ALL_BRANCHES } from "@/lib/admin-branch";
import { prisma } from "@/lib/prisma";
import { dbQueryWithFlag } from "@/lib/db-safe";
import { BranchAvailabilityAdmin } from "@/components/admin/branch-availability-admin";
import {
  MENU_CATEGORY_ORDER,
  getCategoryLabel,
} from "@/lib/categories";
import { getLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Branch availability" };

export default async function AdminAvailabilityPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const locale = await getLocale();
  const branches = await listBranches();
  const activeBranchId = await getActiveBranchId(session, branches);
  const isAllBranches = activeBranchId === ALL_BRANCHES;
  const branch = branches.find((b) => b.id === activeBranchId) ?? null;

  if (branches.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-heading text-3xl text-foreground">Branch availability</h1>
        <p className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          No branches found yet. Run{" "}
          <code className="rounded bg-muted px-1">npm run db:seed-branches</code>{" "}
          to create the branches and the super-admin account.
        </p>
      </div>
    );
  }

  const { data: products, usedFallback: dbOffline } = await dbQueryWithFlag(
    [],
    () =>
      prisma.product.findMany({
        orderBy: [
          { category: "asc" },
          { isBestSeller: "desc" },
          { name: "asc" },
        ],
      })
  );

  const { data: availability } = await dbQueryWithFlag([], () =>
    activeBranchId
      ? prisma.branchProductAvailability.findMany({
          where: { branchId: activeBranchId },
        })
      : Promise.resolve([])
  );

  // Delivery locations the admin enabled for this branch — surfaced at the top.
  const { data: deliveryAreas } = await dbQueryWithFlag([], () =>
    activeBranchId && !isAllBranches
      ? prisma.branchDeliveryArea.findMany({
          where: { branchId: activeBranchId, enabled: true },
          orderBy: [{ governorate: "asc" }, { area: "asc" }],
        })
      : Promise.resolve([])
  );

  const availabilityMap: Record<
    string,
    { available: boolean; priceOverride: number | null }
  > = {};
  for (const a of availability) {
    availabilityMap[a.productId] = {
      available: a.available,
      priceOverride: a.priceOverride != null ? Number(a.priceOverride) : null,
    };
  }

  const categoryOrder = new Map(
    MENU_CATEGORY_ORDER.map((c, i) => [c, i] as const)
  );

  const serializedLines = products
    .map((p) => ({
      id: p.id,
      sectionSlug: p.category,
      sectionLabel: getCategoryLabel(p.category, locale),
      name: locale === "ar" && p.nameAr.trim() ? p.nameAr : p.name,
      basePrice: Number(p.price),
      sortKey: categoryOrder.get(p.category) ?? 99,
    }))
    .sort((a, b) => a.sortKey - b.sortKey || a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-heading text-3xl text-foreground">Branch availability</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Control which products are sold at{" "}
        <span className="font-medium text-primary">
          {isAllBranches ? "all branches" : branch?.name ?? "this branch"}
        </span>
        . Switch branches from the sidebar. Turn a product off if this branch
        doesn&apos;t carry it. Prices are managed on the{" "}
        <span className="font-medium text-primary">Products</span> page.
      </p>

      {/* Delivery locations this branch serves (managed under Delivery areas) */}
      {!isAllBranches && deliveryAreas.length > 0 ? (
        <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">
              Delivery locations for {branch?.name ?? "this branch"}
            </h2>
            <span className="text-xs text-muted-foreground">
              {deliveryAreas.length} area
              {deliveryAreas.length === 1 ? "" : "s"} ·{" "}
              <a href="/admin/delivery-areas" className="text-primary hover:underline">
                Manage
              </a>
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {deliveryAreas.map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-card px-3 py-1 text-xs text-foreground"
              >
                <span className="font-medium">{a.area}</span>
                <span className="text-muted-foreground">{a.governorate}</span>
                <span className="text-primary tabular-nums">
                  KWD {Number(a.deliveryFeeKwd).toFixed(3)}
                </span>
              </span>
            ))}
          </div>
        </div>
      ) : !isAllBranches ? (
        <p className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          No delivery locations enabled for this branch yet. Add them under{" "}
          <a href="/admin/delivery-areas" className="font-medium underline">
            Delivery areas
          </a>
          .
        </p>
      ) : null}

      {isAllBranches ? (
        <p className="mt-4 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
          <strong>All branches mode.</strong> Toggling a product here applies
          the same change to <strong>every branch</strong>. To edit just one
          branch, pick it from the sidebar.
        </p>
      ) : null}

      {dbOffline ? (
        <p className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          Database offline — showing nothing to edit.
        </p>
      ) : serializedLines.length === 0 ? (
        <p className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          No products yet. Add catalog products under{" "}
          <strong>Products</strong> in the admin sidebar.
        </p>
      ) : (
        <div className="mt-8">
          <BranchAvailabilityAdmin
            branchId={activeBranchId!}
            lines={serializedLines}
            availabilityMap={availabilityMap}
          />
        </div>
      )}
    </div>
  );
}
