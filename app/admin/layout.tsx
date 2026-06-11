import { AdminChrome } from "@/components/admin/admin-chrome";
import { getAdminSession } from "@/lib/admin-session";
import { listBranches, getActiveBranchId } from "@/lib/admin-branch";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  const branches = await listBranches();
  const activeBranchId = await getActiveBranchId(session, branches);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminChrome
        session={session}
        branches={branches}
        activeBranchId={activeBranchId}
      >
        {children}
      </AdminChrome>
    </div>
  );
}
