/**
 * Sentinel value for the super-admin "All branches" selection. When this is the
 * active branch, branch-scoped writes are applied to every branch at once.
 * Defined here (a plain module) so both client and server code can import it.
 */
export const ALL_BRANCHES = "__all__";

/** Prisma filter: row applies to all branches (null) or to this branch. */
export function branchScopedOrGlobal(branchId: string) {
  return {
    OR: [{ branchId: null }, { branchId }],
  } as const;
}
