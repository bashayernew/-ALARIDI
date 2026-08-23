"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  expectedAdminEmail,
  expectedAdminPassword,
} from "@/lib/admin-config";
import { verifyPassword } from "@/lib/admin-password";
import { getAdminSession, ADMIN_COOKIE } from "@/lib/admin-session";

async function setSessionCookie(value: string, role: string) {
  const jar = await cookies();
  const opts = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: 60 * 60 * 12,
  };
  jar.set(ADMIN_COOKIE, value, opts);
  // Role cookie lets the middleware restrict limited roles (e.g. BRANCH_SALES).
  jar.set("al_aridi_admin_role", role, opts);
}

export async function adminLogin(
  email: string,
  password: string
): Promise<boolean> {
  const normalized = email.trim().toLowerCase();

  // 1) Config / bootstrap super-admin (works even if the DB is offline).
  if (
    normalized === expectedAdminEmail().toLowerCase() &&
    password === expectedAdminPassword()
  ) {
    await setSessionCookie("1", "SUPER_ADMIN");
    return true;
  }

  // 2) Database-backed admin account (super-admin or branch-admin).
  try {
    const user = await prisma.adminUser.findUnique({
      where: { email: normalized },
    });
    if (user && user.active && verifyPassword(password, user.passwordHash)) {
      await setSessionCookie(`u:${user.id}`, user.role);
      return true;
    }
  } catch {
    // DB offline — fall through to failure.
  }

  return false;
}

export async function adminLogout(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  jar.delete("al_aridi_admin_role");
}

export async function isAdminSession(): Promise<boolean> {
  return (await getAdminSession()) !== null;
}
