"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-session";
import { whatsappDigits } from "@/lib/branch-whatsapp";

export type BranchWhatsappRow = {
  id: string;
  name: string;
  whatsappNumber: string;
};

/**
 * Branches the current admin may edit: a super admin sees all; a branch admin
 * sees only their assigned branch.
 */
export async function getEditableBranchesWhatsapp(): Promise<BranchWhatsappRow[]> {
  const session = await getAdminSession();
  if (!session) return [];
  const where =
    session.role === "SUPER_ADMIN"
      ? {}
      : { id: session.branchId ?? "__none__" };
  const rows = await prisma.branch.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, whatsappNumber: true },
  });
  return rows;
}

/** Update a branch's WhatsApp number. Branch admins may only edit their own. */
export async function updateBranchWhatsapp(
  branchId: string,
  rawNumber: string
): Promise<{ ok: true; number: string } | { ok: false; error: string }> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  if (session.role !== "SUPER_ADMIN" && session.branchId !== branchId) {
    return { ok: false, error: "You can only edit your own branch." };
  }
  const number = whatsappDigits(rawNumber);
  if (rawNumber.trim() && !number) {
    return { ok: false, error: "Enter a valid number (digits, e.g. 9655xxxxxxx)." };
  }
  await prisma.branch.update({
    where: { id: branchId },
    data: { whatsappNumber: number },
  });
  revalidatePath("/");
  revalidatePath("/contact");
  revalidatePath("/gifts");
  revalidatePath("/admin/branch-whatsapp");
  return { ok: true, number };
}
