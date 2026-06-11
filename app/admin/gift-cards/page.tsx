import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminSession } from "@/actions/admin-auth";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/dictionary";
import { prisma } from "@/lib/prisma";
import { dbQuery } from "@/lib/db-safe";
import { getAllGiftCardProductsAdmin } from "@/lib/gift-card-products";
import { GiftCardsAdmin } from "@/components/admin/gift-cards-admin";
import { isPendingGiftCardCode } from "@/lib/gift-cards";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: translate(locale, "admin.nav.giftCards") };
}

export default async function AdminGiftCardsPage() {
  if (!(await isAdminSession())) redirect("/admin/login");
  const locale = await getLocale();
  const t = (k: Parameters<typeof translate>[1]) => translate(locale, k);

  const [catalog, cards] = await Promise.all([
    getAllGiftCardProductsAdmin(),
    dbQuery([], () =>
      prisma.giftCard.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
        include: {
          txns: { orderBy: { createdAt: "desc" }, take: 8 },
          redeemedBy: { select: { name: true, email: true } },
        },
      })
    ),
  ]);

  const rows = cards.map((c) => ({
    id: c.id,
    code: isPendingGiftCardCode(c.code) ? "— (pending payment)" : c.code,
    initialValue: Number(c.initialValue),
    balance: Number(c.balance),
    status: c.status,
    recipientName: c.recipientName || "—",
    recipientEmail: c.recipientEmail || "—",
    recipientPhone: c.recipientPhone || "—",
    redeemedBy: c.redeemedBy
      ? `${c.redeemedBy.name} (${c.redeemedBy.email})`
      : "—",
    enabled: c.enabled,
    expiresAtIso: c.expiresAt?.toISOString() ?? null,
    createdAtIso: c.createdAt.toISOString(),
    txnCount: c.txns.length,
    txns: c.txns.map((txn) => ({
      id: txn.id,
      type: txn.type,
      amount: Number(txn.amount),
      reason: txn.reason,
      createdAtIso: txn.createdAt.toISOString(),
    })),
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-heading text-3xl text-foreground">
        {t("admin.giftCards.title")}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("admin.giftCards.note")}</p>
      <div className="mt-8">
        <GiftCardsAdmin catalog={catalog} rows={rows} />
      </div>
    </div>
  );
}
