import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { expectedAdminEmail } from "@/lib/admin-config";

export type AdminRoleValue = "SUPER_ADMIN" | "BRANCH_ADMIN" | "BRANCH_SALES";

export type AdminSession = {
  /** null for the config/bootstrap super-admin (no DB row). */
  userId: string | null;
  email: string;
  name: string;
  role: AdminRoleValue;
  /** null = all branches (super-admin). */
  branchId: string | null;
};

export const ADMIN_COOKIE = "al_aridi_admin";

/**
 * Resolve the current admin session from the cookie.
 * - "1"        => config/bootstrap super-admin (works even if DB is offline)
 * - "u:<id>"   => database-backed admin account
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  const value = jar.get(ADMIN_COOKIE)?.value;
  if (!value) return null;

  if (value === "1") {
    return {
      userId: null,
      email: expectedAdminEmail(),
      name: "Super Admin",
      role: "SUPER_ADMIN",
      branchId: null,
    };
  }

  if (value.startsWith("u:")) {
    const id = value.slice(2);
    try {
      const u = await prisma.adminUser.findUnique({ where: { id } });
      if (!u || !u.active) return null;
      return {
        userId: u.id,
        email: u.email,
        name: u.name,
        role: u.role as AdminRoleValue,
        branchId: u.branchId,
      };
    } catch {
      return null;
    }
  }

  return null;
}

export async function requireSuperAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    throw new Error("Forbidden: super-admin access required.");
  }
  return session;
}
