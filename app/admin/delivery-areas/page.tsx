import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import { listBranches, getActiveBranchId } from "@/lib/admin-branch";
import { prisma } from "@/lib/prisma";
import { dbQueryWithFlag } from "@/lib/db-safe";
import { BranchDeliveryAreasAdmin } from "@/components/admin/branch-delivery-areas-admin";
import type { DeliveryAreaFormRow } from "@/components/admin/branch-delivery-areas-admin";
import { DeliveryAreaAssignmentAdmin } from "@/components/admin/delivery-area-assignment-admin";
import type { AreaAssignment } from "@/components/admin/delivery-area-assignment-admin";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/dictionary";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: translate(locale, "admin.deliveryAreas.title") };
}

export default async function AdminDeliveryAreasPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const locale = await getLocale();
  const branches = await listBranches();
  const activeBranchId = await getActiveBranchId(session, branches);
  const isSuperAdmin = session.role === "SUPER_ADMIN";

  if (branches.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-heading text-3xl text-foreground">
          {translate(locale, "admin.deliveryAreas.title")}
        </h1>
        <p className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          {translate(locale, "admin.deliveryAreas.noBranches")}
        </p>
      </div>
    );
  }

  // ----- Super admin: global single-branch-per-area assignment editor -----
  if (isSuperAdmin) {
    const { data: rows, usedFallback: dbOffline } = await dbQueryWithFlag(
      [],
      () =>
        prisma.branchDeliveryArea.findMany({
          where: { enabled: true },
          select: {
            governorate: true,
            area: true,
            branchId: true,
            deliveryFeeKwd: true,
          },
        })
    );

    const initialAssignments: Record<string, AreaAssignment> = {};
    for (const r of rows) {
      initialAssignments[`${r.governorate}:${r.area}`] = {
        branchId: r.branchId,
        fee: Number(r.deliveryFeeKwd),
      };
    }

    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="font-heading text-3xl text-foreground">
          {translate(locale, "admin.deliveryAreas.title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Assign which branch delivers to each area across Kuwait.
        </p>

        {dbOffline ? (
          <p className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
            {translate(locale, "admin.deliveryAreas.dbOffline")}
          </p>
        ) : (
          <div className="mt-8">
            <DeliveryAreaAssignmentAdmin
              branches={branches.map((b) => ({ id: b.id, name: b.name }))}
              initialAssignments={initialAssignments}
            />
          </div>
        )}
      </div>
    );
  }

  // ----- Branch admin: read-only view of their own branch's areas -----
  const branch = branches.find((b) => b.id === activeBranchId) ?? null;

  const { data: rows, usedFallback: dbOffline } = await dbQueryWithFlag(
    [],
    () =>
      activeBranchId
        ? prisma.branchDeliveryArea.findMany({
            where: { branchId: activeBranchId },
          })
        : Promise.resolve([])
  );

  const initialRows: DeliveryAreaFormRow[] = rows.map((r) => ({
    governorate: r.governorate,
    area: r.area,
    areaNameEn: r.area,
    enabled: r.enabled,
    deliveryFeeKwd: Number(r.deliveryFeeKwd),
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-heading text-3xl text-foreground">
        {translate(locale, "admin.deliveryAreas.title")}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {translate(locale, "admin.deliveryAreas.subtitle", {
          branch: branch?.name ?? "—",
        })}
      </p>

      {dbOffline ? (
        <p className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          {translate(locale, "admin.deliveryAreas.dbOffline")}
        </p>
      ) : !activeBranchId ? (
        <p className="mt-6 text-sm text-muted-foreground">
          {translate(locale, "admin.deliveryAreas.pickBranch")}
        </p>
      ) : (
        <div className="mt-8">
          <BranchDeliveryAreasAdmin
            branchId={activeBranchId}
            initialRows={initialRows}
            readOnly
          />
        </div>
      )}
    </div>
  );
}
