"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isPrismaConnectionError } from "@/lib/db-safe";
import { sendContactNotificationEmail } from "@/lib/email";
import { getLocale } from "@/lib/i18n-server";
import { areaDisplayLabel } from "@/lib/kuwait-areas";
import {
  getSelectedArea,
  getSelectedPickupBranchId,
  resolveDeliveryStorefrontBranch,
} from "@/lib/storefront-branch";

export type ContactSubmissionResult =
  | { ok: true }
  | { ok: false; error: "validation" | "service_unavailable" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function resolveContactBranchId(): Promise<{
  branchId: string | null;
  customerArea: string;
}> {
  const locale = await getLocale();
  const selectedArea = await getSelectedArea();
  const customerArea = selectedArea
    ? areaDisplayLabel(selectedArea, locale)
    : "";

  const pickupId = await getSelectedPickupBranchId();
  if (pickupId) {
    return { branchId: pickupId, customerArea };
  }

  const delivery = await resolveDeliveryStorefrontBranch();
  return {
    branchId: delivery?.branchId ?? null,
    customerArea,
  };
}

export async function submitContactForm(input: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}): Promise<ContactSubmissionResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const message = input.message.trim();
  if (!name || !EMAIL_RE.test(email) || !message) {
    return { ok: false, error: "validation" };
  }

  const { branchId, customerArea } = await resolveContactBranchId();

  try {
    await prisma.contactSubmission.create({
      data: {
        name,
        email,
        phone: input.phone?.trim() || "",
        subject: input.subject?.trim() || "",
        message,
        branchId,
        customerArea,
      },
    });

    sendContactNotificationEmail({
      fromName: name,
      fromEmail: email,
      subject: input.subject?.trim() || "",
      body: message,
    }).catch(() => {});

    revalidatePath("/admin/contact");
    return { ok: true };
  } catch (e) {
    if (isPrismaConnectionError(e)) {
      return { ok: false, error: "service_unavailable" };
    }
    throw e;
  }
}
