import { redirect } from "next/navigation";
import { isAdminSession } from "@/actions/admin-auth";
import { getAdminSession } from "@/lib/admin-session";
import { getActiveBranchId, listBranches, ALL_BRANCHES } from "@/lib/admin-branch";
import { prisma } from "@/lib/prisma";
import { dbQueryWithFlag } from "@/lib/db-safe";
import { OrderRow } from "@/components/admin/order-row";
import { getLocale } from "@/lib/i18n-server";
import type { Metadata } from "next";
import { translate, type TranslationKey } from "@/lib/dictionary";
import { OrderStatus } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatGiftDeliverySummary } from "@/lib/gift-delivery";
import { ExportCsvButton } from "@/components/admin/export-csv-button";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: translate(locale, "nav.admin") };
}

function isOrderStatus(v: string | undefined): v is OrderStatus {
  if (!v) return false;
  return (Object.values(OrderStatus) as string[]).includes(v);
}

const orderStatusLabel: Record<OrderStatus, TranslationKey> = {
  [OrderStatus.PENDING]: "admin.orderStatus.pending",
  [OrderStatus.PAID]: "admin.orderStatus.paid",
  [OrderStatus.PREPARING]: "admin.orderStatus.preparing",
  [OrderStatus.OUT_FOR_DELIVERY]: "admin.orderStatus.outForDelivery",
  [OrderStatus.DELIVERED]: "admin.orderStatus.delivered",
  [OrderStatus.CANCELLED]: "admin.orderStatus.cancelled",
};

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; status?: string; from?: string; to?: string }>;
}) {
  if (!(await isAdminSession())) redirect("/admin/login");

  const locale = await getLocale();
  const t = (key: TranslationKey) => translate(locale, key);
  const sp = (await searchParams) ?? {};
  const qRaw = (sp.q ?? "").trim().toLowerCase();
  const statusFilter = isOrderStatus(sp.status) ? sp.status : null;
  const fromDate = sp.from ? new Date(`${sp.from}T00:00:00`) : null;
  const toDate = sp.to ? new Date(`${sp.to}T23:59:59.999`) : null;

  const session = await getAdminSession();
  const branches = await listBranches();
  const activeBranchId = await getActiveBranchId(session, branches);
  const isAllBranches = activeBranchId === ALL_BRANCHES;
  const activeBranch = branches.find((b) => b.id === activeBranchId);

  const { data: orders, usedFallback: dbOffline } = await dbQueryWithFlag(
    [],
    () =>
      prisma.order.findMany({
        where: {
          // In "All branches" mode (super-admin) don't scope by branch so
          // every branch's orders are listed. Otherwise scope to the active
          // branch. The ALL_BRANCHES sentinel is not a real branchId, so it
          // must never be used as a filter value.
          ...(activeBranchId && !isAllBranches
            ? { branchId: activeBranchId }
            : {}),
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(fromDate || toDate
            ? {
                createdAt: {
                  ...(fromDate ? { gte: fromDate } : {}),
                  ...(toDate ? { lte: toDate } : {}),
                },
              }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 120,
        include: {
          branch: { select: { name: true, nameAr: true } },
          items: {
            include: {
              product: { select: { name: true } },
            },
          },
          giftCardItems: {
            include: {
              giftCardProduct: { select: { titleEn: true } },
            },
          },
          giftBasketItems: {
            include: {
              giftBasket: { select: { nameEn: true } },
            },
          },
        },
      })
  );

  let filtered = orders;
  if (qRaw) {
    filtered = filtered.filter((o) => {
      const blob = [
        o.id,
        o.customerName,
        o.phone,
        o.address,
        o.customerUserId ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(qRaw);
    });
  }

  const exportRows = filtered.map((o) => ({
    id: o.id,
    date: o.createdAt.toISOString().slice(0, 16).replace("T", " "),
    customer: o.customerName,
    phone: o.phone,
    address: o.address,
    fulfillment: o.fulfillmentType,
    status: o.status,
    payment: o.paymentMethod ?? "",
    items: [
      ...o.items.map((i) => `${i.quantity}x ${i.product?.name ?? ""}`),
      ...o.giftCardItems.map(
        (i) => `${i.quantity}x ${i.giftCardProduct?.titleEn ?? "Gift card"}`
      ),
      ...o.giftBasketItems.map(
        (i) => `${i.quantity}x ${i.giftBasket?.nameEn ?? "Gift basket"}`
      ),
    ].join(" | "),
    total: Number(o.total).toFixed(3),
  }));

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
      {dbOffline && (
        <p className="mb-6 rounded-xl border border-border bg-primary/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          {t("admin.dashboard.dbOffline")}
        </p>
      )}
      <div>
        <h1 className="font-heading text-3xl text-foreground">
          {activeBranch
            ? translate(locale, "admin.dashboard.branchHeading", {
                branch: activeBranch.name,
              })
            : t("admin.dashboard.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("admin.dashboard.subtitle")}
        </p>
      </div>

      <form
        className="mt-6 flex max-w-2xl flex-wrap items-end gap-3"
        action="/admin"
        method="get"
      >
        <div className="min-w-[200px] flex-1 space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="q">
            {t("admin.orders.search")}
          </label>
          <Input
            id="q"
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder={t("admin.orders.search")}
            className="border-border bg-card text-foreground"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="status">
            {t("admin.dashboard.th.status")}
          </label>
          <select
            id="status"
            name="status"
            defaultValue={sp.status ?? ""}
            className="flex h-9 w-[200px] rounded-md border border-border bg-card px-3 text-sm text-foreground"
          >
            <option value="">{t("admin.orders.filter.all")}</option>
            {(Object.values(OrderStatus) as OrderStatus[]).map((s) => (
              <option key={s} value={s}>
                {t(orderStatusLabel[s])}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="from">
            {t("admin.orders.filter.from")}
          </label>
          <Input
            id="from"
            name="from"
            type="date"
            defaultValue={sp.from ?? ""}
            className="w-[160px] border-border bg-card text-foreground"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="to">
            {t("admin.orders.filter.to")}
          </label>
          <Input
            id="to"
            name="to"
            type="date"
            defaultValue={sp.to ?? ""}
            className="w-[160px] border-border bg-card text-foreground"
          />
        </div>
        <Button
          type="submit"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {t("admin.orders.apply")}
        </Button>
        <ExportCsvButton
          filename="orders.csv"
          label={t("admin.export.excel")}
          headers={[
            { key: "id", label: "Order ID" },
            { key: "date", label: "Date" },
            { key: "customer", label: "Customer" },
            { key: "phone", label: "Phone" },
            { key: "address", label: "Address" },
            { key: "fulfillment", label: "Fulfillment" },
            { key: "status", label: "Status" },
            { key: "payment", label: "Payment" },
            { key: "items", label: "Items" },
            { key: "total", label: "Total (KWD)" },
          ]}
          rows={exportRows}
        />
      </form>

      <div className="mt-8 space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card/40 px-4 py-10 text-center text-muted-foreground">
            {dbOffline
              ? t("admin.dashboard.ordersLoad")
              : t("admin.dashboard.noOrders")}
          </div>
        ) : (
              filtered.map((o) => (
                <OrderRow
                  key={o.id}
                  locale={locale}
                  order={{
                    id: o.id,
                    customerName: o.customerName,
                    phone: o.phone,
                    address: o.address,
                    latitude: o.latitude,
                    longitude: o.longitude,
                    fulfillmentType: o.fulfillmentType,
                    pickupBranchName:
                      o.fulfillmentType === "PICKUP" && o.branch
                        ? locale === "ar" && o.branch.nameAr.trim()
                          ? o.branch.nameAr
                          : o.branch.name
                        : null,
                    customerUserId: o.customerUserId,
                    total: Number(o.total),
                    status: o.status,
                    paymentMethod: o.paymentMethod,
                    createdAt: o.createdAt,
                    items: [
                      ...o.items.map((i) => ({
                        quantity: i.quantity,
                        name: i.product.name,
                        deliverySummary: formatGiftDeliverySummary(
                          {
                            fulfillmentType: i.giftFulfillmentType,
                            recipientName: i.recipientName,
                            receiverPhone: i.receiverPhone,
                            receiverAddress: i.receiverAddress,
                            pickupBranch: i.pickupBranch,
                            deliveryDate: i.deliveryDate,
                            deliveryTimeSlot: i.deliveryTimeSlot,
                            deliveryNotes: i.deliveryNotes,
                          },
                          locale
                        ),
                      })),
                      ...o.giftCardItems.map((i) => ({
                        quantity: i.quantity,
                        name: i.giftCardProduct.titleEn,
                        deliverySummary: formatGiftDeliverySummary(
                          {
                            fulfillmentType: i.giftFulfillmentType,
                            recipientName: i.recipientName,
                            receiverPhone: i.receiverPhone,
                            receiverAddress: i.receiverAddress,
                            pickupBranch: i.pickupBranch,
                            deliveryDate: i.deliveryDate,
                            deliveryTimeSlot: i.deliveryTimeSlot,
                            deliveryNotes: i.deliveryNotes,
                          },
                          locale
                        ),
                      })),
                      ...o.giftBasketItems.map((i) => ({
                        quantity: i.quantity,
                        name: i.giftBasket.nameEn,
                        deliverySummary: formatGiftDeliverySummary(
                          {
                            fulfillmentType: i.giftFulfillmentType,
                            recipientName: i.recipientName,
                            receiverPhone: i.receiverPhone,
                            receiverAddress: i.receiverAddress,
                            pickupBranch: i.pickupBranch,
                            deliveryDate: i.deliveryDate,
                            deliveryTimeSlot: i.deliveryTimeSlot,
                            deliveryNotes: i.deliveryNotes,
                          },
                          locale
                        ),
                      })),
                    ],
                  }}
                />
              ))
        )}
      </div>
    </div>
  );
}
