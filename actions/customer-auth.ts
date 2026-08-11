"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  hashPasswordServer,
  verifyPasswordServer,
} from "@/lib/customer-auth/server-password";
import {
  clearCustomerSessionCookie,
  generateSessionToken,
  getCurrentCustomer,
  readSessionToken,
  setCustomerSessionCookie,
} from "@/lib/customer-auth/server";
import { SESSION_MAX_AGE_SEC } from "@/lib/customer-auth/constants";
import { isPrismaConnectionError } from "@/lib/db-safe";
import type { PublicCustomer } from "@/lib/customer-auth/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AuthResult<T = { customer: PublicCustomer }> =
  | ({ ok: true } & T)
  | { ok: false; code: AuthErrorCode };

export type AuthErrorCode =
  | "invalid"
  | "email_taken"
  | "validation"
  | "service_unavailable";

export type RegisterInput = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  referralCode?: string;
};

async function createSession(customerId: string): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SEC * 1000);
  await prisma.customerSession.create({
    data: { token, customerId, expiresAt },
  });
  return token;
}

export async function registerCustomer(
  input: RegisterInput
): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  const phone = input.phone.trim();
  if (!EMAIL_RE.test(email) || !fullName || !phone || input.password.length < 8) {
    return { ok: false, code: "validation" };
  }

  try {
    const { hash, salt } = hashPasswordServer(input.password);

    // Resolve referrer if a referralCode was provided.
    let referredById: string | null = null;
    if (input.referralCode) {
      const ref = await prisma.customer.findUnique({
        where: { referralCode: input.referralCode.trim() },
        select: { id: true },
      });
      referredById = ref?.id ?? null;
    }

    const created = await prisma.customer.create({
      data: {
        email,
        name: fullName,
        phone,
        passwordHash: hash,
        passwordSalt: salt,
        referredById: referredById ?? undefined,
      },
    });

    const token = await createSession(created.id);
    await setCustomerSessionCookie(token);

    revalidatePath("/account");
    const customer = await getCurrentCustomer();
    if (!customer) return { ok: false, code: "service_unavailable" };
    return { ok: true, customer };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, code: "email_taken" };
    }
    if (isPrismaConnectionError(e)) {
      return { ok: false, code: "service_unavailable" };
    }
    throw e;
  }
}

export async function loginCustomer(
  email: string,
  password: string
): Promise<AuthResult> {
  const e = email.trim().toLowerCase();
  if (!EMAIL_RE.test(e) || !password) {
    return { ok: false, code: "validation" };
  }

  try {
    const row = await prisma.customer.findUnique({ where: { email: e } });
    if (!row) return { ok: false, code: "invalid" };

    const ok = verifyPasswordServer(
      password,
      row.passwordHash,
      row.passwordSalt
    );
    if (!ok) return { ok: false, code: "invalid" };

    const token = await createSession(row.id);
    await setCustomerSessionCookie(token);

    revalidatePath("/account");
    const customer = await getCurrentCustomer();
    if (!customer) return { ok: false, code: "service_unavailable" };
    return { ok: true, customer };
  } catch (err) {
    if (isPrismaConnectionError(err)) {
      return { ok: false, code: "service_unavailable" };
    }
    throw err;
  }
}

export async function logoutCustomer(): Promise<void> {
  const token = await readSessionToken();
  if (token) {
    await prisma.customerSession
      .deleteMany({ where: { token } })
      .catch(() => {});
  }
  await clearCustomerSessionCookie();
  revalidatePath("/");
}

/** For the client provider to refresh its in-memory copy. */
export async function getMe(): Promise<PublicCustomer | null> {
  return getCurrentCustomer();
}

/** Update profile info (name, phone, birthday). */
export async function updateCustomerProfile(input: {
  fullName?: string;
  phone?: string;
  birthdayIso?: string | null;
}): Promise<AuthResult> {
  const token = await readSessionToken();
  if (!token) return { ok: false, code: "invalid" };

  const session = await prisma.customerSession.findUnique({
    where: { token },
    select: { customerId: true, expiresAt: true },
  });
  if (!session || session.expiresAt < new Date()) {
    return { ok: false, code: "invalid" };
  }

  const data: {
    name?: string;
    phone?: string;
    birthday?: Date | null;
  } = {};
  if (input.fullName !== undefined) data.name = input.fullName.trim();
  if (input.phone !== undefined) data.phone = input.phone.trim();
  if (input.birthdayIso !== undefined) {
    data.birthday = input.birthdayIso ? new Date(input.birthdayIso) : null;
  }

  await prisma.customer.update({
    where: { id: session.customerId },
    data,
  });

  revalidatePath("/account");
  const customer = await getCurrentCustomer();
  if (!customer) return { ok: false, code: "service_unavailable" };
  return { ok: true, customer };
}

/** Add an address. */
export async function addCustomerAddress(input: {
  label?: string;
  street: string;
  building?: string;
  block?: string;
  city?: string;
  houseNumber?: string;
  floor?: string;
  doorNumber?: string;
  area: string;
  notes?: string;
  latitude?: number | null;
  longitude?: number | null;
  setDefault?: boolean;
}): Promise<AuthResult> {
  const token = await readSessionToken();
  if (!token) return { ok: false, code: "invalid" };
  const session = await prisma.customerSession.findUnique({
    where: { token },
    select: { customerId: true, expiresAt: true },
  });
  if (!session || session.expiresAt < new Date()) {
    return { ok: false, code: "invalid" };
  }

  await prisma.$transaction(async (tx) => {
    if (input.setDefault) {
      await tx.customerAddress.updateMany({
        where: { customerId: session.customerId },
        data: { isDefault: false },
      });
    }
    await tx.customerAddress.create({
      data: {
        customerId: session.customerId,
        label: input.label?.trim() || "Home",
        street: input.street.trim(),
        building: (input.building ?? "").trim(),
        block: (input.block ?? "").trim(),
        houseNumber: (input.houseNumber ?? "").trim(),
        floor: (input.floor ?? "").trim(),
        doorNumber: (input.doorNumber ?? "").trim(),
        city: (input.city ?? "").trim(),
        area: input.area,
        notes: input.notes?.trim() || null,
        latitude: typeof input.latitude === "number" ? input.latitude : null,
        longitude: typeof input.longitude === "number" ? input.longitude : null,
        isDefault: !!input.setDefault,
      },
    });
  });

  revalidatePath("/account");
  const customer = await getCurrentCustomer();
  if (!customer) return { ok: false, code: "service_unavailable" };
  return { ok: true, customer };
}

export async function updateCustomerAddress(
  addressId: string,
  input: {
    label?: string;
    street: string;
    building?: string;
    block?: string;
    city?: string;
    houseNumber?: string;
    floor?: string;
    doorNumber?: string;
    area: string;
    notes?: string;
    setDefault?: boolean;
  }
): Promise<AuthResult> {
  const token = await readSessionToken();
  if (!token) return { ok: false, code: "invalid" };
  const session = await prisma.customerSession.findUnique({
    where: { token },
    select: { customerId: true, expiresAt: true },
  });
  if (!session || session.expiresAt < new Date()) {
    return { ok: false, code: "invalid" };
  }

  await prisma.$transaction(async (tx) => {
    if (input.setDefault) {
      await tx.customerAddress.updateMany({
        where: { customerId: session.customerId },
        data: { isDefault: false },
      });
    }
    await tx.customerAddress.updateMany({
      where: { id: addressId, customerId: session.customerId },
      data: {
        label: input.label?.trim() || "Home",
        street: input.street.trim(),
        building: (input.building ?? "").trim(),
        block: (input.block ?? "").trim(),
        houseNumber: (input.houseNumber ?? "").trim(),
        floor: (input.floor ?? "").trim(),
        doorNumber: (input.doorNumber ?? "").trim(),
        city: (input.city ?? "").trim(),
        area: input.area,
        notes: input.notes?.trim() || null,
        ...(input.setDefault ? { isDefault: true } : {}),
      },
    });
  });

  revalidatePath("/account");
  const customer = await getCurrentCustomer();
  if (!customer) return { ok: false, code: "service_unavailable" };
  return { ok: true, customer };
}

export async function deleteCustomerAddress(addressId: string): Promise<AuthResult> {
  const token = await readSessionToken();
  if (!token) return { ok: false, code: "invalid" };
  const session = await prisma.customerSession.findUnique({
    where: { token },
    select: { customerId: true, expiresAt: true },
  });
  if (!session || session.expiresAt < new Date()) {
    return { ok: false, code: "invalid" };
  }
  await prisma.customerAddress.deleteMany({
    where: { id: addressId, customerId: session.customerId },
  });
  revalidatePath("/account");
  const customer = await getCurrentCustomer();
  if (!customer) return { ok: false, code: "service_unavailable" };
  return { ok: true, customer };
}
