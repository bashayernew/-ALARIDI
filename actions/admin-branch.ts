"use server";

import { cookies } from "next/headers";
import { getAdminSession } from "@/lib/admin-session";
import { ADMIN_BRANCH_COOKIE } from "@/lib/admin-branch";

/** Super-admins switch the active branch; branch-admins are locked to theirs. */
export async function setActiveBranch(branchId: string): Promise<void> {
  const session = await getAdminSession();
  if (!session || session.role === "BRANCH_ADMIN") return;

  const jar = await cookies();
  jar.set(ADMIN_BRANCH_COOKIE, branchId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: 60 * 60 * 24 * 30,
  });
}
