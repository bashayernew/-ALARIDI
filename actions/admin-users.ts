"use server";

import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-session";
import { hashPassword } from "@/lib/admin-password";

type Result = { ok: boolean; error?: string };

export async function createAdminUser(input: {
  email: string;
  name: string;
  password: string;
  role: "SUPER_ADMIN" | "BRANCH_ADMIN" | "BRANCH_SALES";
  branchId: string | null;
}): Promise<Result> {
  await requireSuperAdmin();

  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) return { ok: false, error: "Enter a valid email." };
  if (!input.password || input.password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }
  const branchId = input.role === "SUPER_ADMIN" ? null : input.branchId;
  if (input.role !== "SUPER_ADMIN" && !branchId) {
    return { ok: false, error: "Choose a branch for a branch admin." };
  }

  try {
    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) {
      return { ok: false, error: "An account with that email already exists." };
    }
    await prisma.adminUser.create({
      data: {
        email,
        name: input.name.trim(),
        passwordHash: hashPassword(input.password),
        role: input.role,
        branchId,
      },
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not create the account." };
  }
}

export async function setAdminUserActive(
  id: string,
  active: boolean
): Promise<Result> {
  await requireSuperAdmin();
  try {
    await prisma.adminUser.update({ where: { id }, data: { active } });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update the account." };
  }
}

export async function resetAdminPassword(
  id: string,
  password: string
): Promise<Result> {
  await requireSuperAdmin();
  if (!password || password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }
  try {
    await prisma.adminUser.update({
      where: { id },
      data: { passwordHash: hashPassword(password) },
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reset the password." };
  }
}

export async function deleteAdminUser(id: string): Promise<Result> {
  await requireSuperAdmin();
  try {
    await prisma.adminUser.delete({ where: { id } });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not delete the account." };
  }
}
