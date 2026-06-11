"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  expectedAdminEmail,
  expectedAdminPassword,
} from "@/lib/admin-config";
import { verifyPassword } from "@/lib/admin-password";
import { getAdminSession, ADMIN_COOKIE } from "@/lib/admin-session";

async function setSessionCookie(value: string) {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: 60 * 60 * 12,
  });
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
    await setSessionCookie("1");
    return true;
  }

  // 2) Database-backed admin account (super-admin or branch-admin).
  try {
    const user = await prisma.adminUser.findUnique({
      where: { email: normalized },
    });
    if (user && user.active && verifyPassword(password, user.passwordHash)) {
      await setSessionCookie(`u:${user.id}`);
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
}

export async function isAdminSession(): Promise<boolean> {
  return (await getAdminSession()) !== null;
}
