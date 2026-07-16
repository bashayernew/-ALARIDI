import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import { listBranches } from "@/lib/admin-branch";
import { prisma } from "@/lib/prisma";
import { AccountsAdmin } from "@/components/admin/accounts-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin accounts" };

export default async function AdminAccountsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (session.role !== "SUPER_ADMIN") redirect("/admin");

  const branches = await listBranches();

  // Current area -> branch assignments (drives the picker in the form).
  let areaAssignments: {
    governorate: string;
    area: string;
    branchId: string;
  }[] = [];
  try {
    areaAssignments = (
      await prisma.branchDeliveryArea.findMany({
        select: { governorate: true, area: true, branchId: true },
      })
    ).map((r) => ({
      governorate: r.governorate,
      area: r.area,
      branchId: r.branchId,
    }));
  } catch {
    // areas table unavailable
  }

  type AdminUserRow = {
    id: string;
    email: string;
    name: string;
    role: string;
    branchId: string | null;
    branch: { name: string } | null;
    active: boolean;
  };

  // The new tables/Prisma client may not exist until the migration is run.
  // Catch any error (incl. missing model) and show a setup notice instead of 500.
  let users: AdminUserRow[] = [];
  let dbOffline = false;
  try {
    users = (await prisma.adminUser.findMany({
      orderBy: { createdAt: "desc" },
      include: { branch: true },
    })) as unknown as AdminUserRow[];
  } catch {
    dbOffline = true;
  }

  const rows = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role as "SUPER_ADMIN" | "BRANCH_ADMIN",
    branchId: u.branchId,
    branchName: u.branch?.name ?? null,
    active: u.active,
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-heading text-3xl text-foreground">Admin accounts</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Create logins for staff and assign each one to a single branch. A
        super-admin can see and manage every branch; a branch-admin only sees
        their own.
      </p>

      {dbOffline ? (
        <p className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          Database offline or the accounts table is missing. Run the migration
          and{" "}
          <code className="rounded bg-muted px-1">npm run db:seed-branches</code>
          .
        </p>
      ) : (
        <div className="mt-8">
          <AccountsAdmin
            rows={rows}
            branches={branches.map((b) => ({ id: b.id, name: b.name }))}
            areaAssignments={areaAssignments}
            currentEmail={session.email}
          />
        </div>
      )}
    </div>
  );
}
