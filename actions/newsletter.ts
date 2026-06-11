"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isPrismaConnectionError } from "@/lib/db-safe";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SubscribeResult =
  | { ok: true; alreadySubscribed: boolean }
  | { ok: false; error: "validation" | "service_unavailable" };

export async function subscribeNewsletter(input: {
  email: string;
  locale?: "en" | "ar";
}): Promise<SubscribeResult> {
  const email = input.email.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: "validation" };

  try {
    try {
      await prisma.newsletterSubscriber.create({
        data: { email, locale: input.locale || "en" },
      });
      return { ok: true, alreadySubscribed: false };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        // Re-activate if previously unsubscribed.
        await prisma.newsletterSubscriber.update({
          where: { email },
          data: { active: true, unsubscribedAt: null },
        });
        return { ok: true, alreadySubscribed: true };
      }
      throw e;
    }
  } catch (e) {
    if (isPrismaConnectionError(e)) {
      return { ok: false, error: "service_unavailable" };
    }
    throw e;
  }
}
