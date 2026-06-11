import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminSession } from "@/actions/admin-auth";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/dictionary";
import { prisma } from "@/lib/prisma";
import { dbQuery } from "@/lib/db-safe";
import { UsersAdmin } from "@/components/admin/users-admin";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: translate(locale, "admin.nav.users") };
}

export default async function AdminUsersPage() {
  if (!(await isAdminSession())) redirect("/admin/login");

  const locale = await getLocale();
  const t = (k: Parameters<typeof translate>[1]) => translate(locale, k);

  const customers = await dbQuery([], () =>
    prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        addresses: true,
        orders: { orderBy: { createdAt: "desc" }, take: 5 },
        _count: { select: { orders: true, loyaltyTxns: true } },
      },
    })
  );

  const rows = customers.map((c) => ({
    id: c.id,
    fullName: c.name,
    email: c.email,
    phone: c.phone,
    loyaltyBalance: c.loyaltyBalance,
    lifetimePoints: c.lifetimePoints,
    tier: c.tier,
    createdAtIso: c.createdAt.toISOString(),
    ordersCount: c._count.orders,
    referralCode: c.referralCode,
    addresses: c.addresses.map((a) => ({
      id: a.id,
      label: a.label,
      street: a.street,
      building: a.building,
      area: a.area,
    })),
    recentOrders: c.orders.map((o) => ({
      id: o.id,
      total: Number(o.total),
      status: o.status,
    })),
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-heading text-3xl text-foreground">
        {t("admin.users.title")}
      </h1>
      <div className="mt-8">
        <UsersAdmin rows={rows} />
      </div>
    </div>
  );
}
