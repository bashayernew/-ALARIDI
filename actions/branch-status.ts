"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-session";

export type BranchStoreStatus = "OPEN" | "BUSY" | "CLOSED";

/** Super-admin only: open / busy / close a branch for new orders. */
export async function setBranchStoreStatus(
  branchId: string,
  status: BranchStoreStatus
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getAdminSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return { ok: false, error: "Only the super admin can open or close branches." };
  }
  if (!["OPEN", "BUSY", "CLOSED"].includes(status)) {
    return { ok: false, error: "Invalid status" };
  }
  await prisma.branch.update({
    where: { id: branchId },
    data: { storeStatus: status },
  });
  revalidatePath("/admin");
  revalidatePath("/", "layout");
  return { ok: true };
}
