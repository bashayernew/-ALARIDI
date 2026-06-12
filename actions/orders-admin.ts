"use server";

import { revalidatePath } from "next/cache";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/actions/admin-auth";
import { getAdminSession } from "@/lib/admin-session";
import { listBranches } from "@/lib/admin-branch";
import { assertAdminCanAccessOrder } from "@/lib/order-branch";
import {
  activateGiftCardsForOrder,
  disableGiftCardAdmin,
  expireGiftCardAdmin,
  sendActivatedGiftCardEmails,
} from "@/lib/gift-card-activate";
import { awardLoyaltyForPaidOrder } from "@/lib/loyalty-points";

async function requireAdmin() {
  if (!(await isAdminSession())) throw new Error("Unauthorized");
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  await requireAdmin();

  const emails = await prisma.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({ where: { id: orderId } });
    if (!existing) throw new Error("Order not found");

    const session = await getAdminSession();
    if (!session) throw new Error("Unauthorized");
    const branches = await listBranches();
    await assertAdminCanAccessOrder(existing.branchId, session, branches);

    // Payments are handled manually until a payment gateway is integrated, so an
    // admin can move an order through any status. Marking it PAID still triggers
    // the loyalty / gift-card activation below. (When a gateway goes live it can
    // set PAID via its own confirmation handler, reusing the same activation.)
    await tx.order.update({
      where: { id: orderId },
      data: { status },
    });

    if (status === OrderStatus.PAID && existing.status !== OrderStatus.PAID) {
      await awardLoyaltyForPaidOrder(tx, orderId);
      return activateGiftCardsForOrder(tx, orderId);
    }
    return [];
  });

  await sendActivatedGiftCardEmails(emails);
  revalidatePath("/admin");
  revalidatePath("/admin/gift-cards");
  revalidatePath("/admin/loyalty");
  revalidatePath("/account");
  revalidatePath("/loyalty");
}

export async function adminExpireGiftCard(id: string) {
  await requireAdmin();
  await prisma.$transaction((tx) => expireGiftCardAdmin(tx, id));
  revalidatePath("/admin/gift-cards");
  revalidatePath("/account");
}

export async function adminDisableGiftCard(id: string) {
  await requireAdmin();
  await prisma.$transaction((tx) => disableGiftCardAdmin(tx, id));
  revalidatePath("/admin/gift-cards");
  revalidatePath("/account");
}
