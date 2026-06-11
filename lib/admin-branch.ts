import "server-only";

import { cookies } from "next/headers";
import type { AdminSession } from "@/lib/admin-session";
import type { BranchDTO } from "@/lib/branches";
import { listBranches } from "@/lib/branch-list";
import { ALL_BRANCHES } from "@/lib/branch-scope";

export const ADMIN_BRANCH_COOKIE = "al_aridi_branch";

export { listBranches, ALL_BRANCHES };

/**
 * The branch the admin is currently acting on.
 * - Branch-admins are always locked to their assigned branch.
 * - Super-admins use the cookie selection, falling back to the first branch.
 */
export async function getActiveBranchId(
  session: AdminSession | null,
  branches: BranchDTO[]
): Promise<string | null> {
  if (!session) return null;
  if (session.role === "BRANCH_ADMIN") return session.branchId;

  const jar = await cookies();
  const selected = jar.get(ADMIN_BRANCH_COOKIE)?.value;
  // Super-admin "All branches" mode.
  if (selected === ALL_BRANCHES) return ALL_BRANCHES;
  if (selected && branches.some((b) => b.id === selected)) return selected;
  return branches[0]?.id ?? null;
}

/**
 * Expand the active branch selection into the concrete branch ids a write
 * should target. Super-admins in "All branches" mode write to every branch;
 * otherwise just the one selected. Branch-admins are always restricted to
 * their own branch, even if "All branches" is somehow requested.
 */
export async function resolveWriteBranchIds(
  session: AdminSession,
  branchId: string
): Promise<string[]> {
  if (session.role === "BRANCH_ADMIN") {
    if (!session.branchId) return [];
    if (branchId !== session.branchId && branchId !== ALL_BRANCHES) {
      throw new Error("Forbidden: cannot edit another branch.");
    }
    return [session.branchId];
  }
  // Super-admin
  if (branchId === ALL_BRANCHES) {
    const branches = await listBranches();
    return branches.map((b) => b.id);
  }
  return [branchId];
}
