"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";
import { formatKwd } from "@/lib/format";

export type AdminCustomerRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  loyaltyBalance: number;
  lifetimePoints: number;
  tier: "SILVER" | "GOLD" | "PLATINUM";
  createdAtIso: string;
  ordersCount: number;
  referralCode: string;
  addresses: { id: string; label: string; street: string; building: string; area: string }[];
  recentOrders: { id: string; total: number; status: string }[];
};

export function UsersAdmin({ rows }: { rows: AdminCustomerRow[] }) {
  const { t } = useI18n();
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");

  const q = search.trim().toLowerCase();
  const filtered = q
    ? rows.filter(
        (r) =>
          r.fullName.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.phone.toLowerCase().includes(q)
      )
    : rows;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t("admin.users.note")}</p>
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("admin.users.searchPlaceholder")}
        className="h-10 w-full max-w-sm rounded-lg border border-border bg-card/40 px-3 text-sm text-foreground"
      />
      <div className="overflow-x-auto rounded-2xl border border-border bg-card/40">
        <table className="w-full min-w-[820px] text-start text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-start">{t("auth.field.fullName")}</th>
              <th className="px-4 py-3 text-start">{t("admin.users.email")}</th>
              <th className="px-4 py-3 text-start">{t("admin.users.phone")}</th>
              <th className="px-4 py-3 text-start">{t("admin.users.tier")}</th>
              <th className="px-4 py-3 text-start">{t("admin.users.points")}</th>
              <th className="px-4 py-3 text-start">{t("admin.users.ordersCount")}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  —
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <React.Fragment key={c.id}>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {c.fullName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.phone}</td>
                    <td className="px-4 py-3 text-primary">{c.tier}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {c.loyaltyBalance} / {c.lifetimePoints}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {c.ordersCount}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-border"
                        onClick={() =>
                          setOpenId((id) => (id === c.id ? null : c.id))
                        }
                      >
                        {openId === c.id ? "−" : "+"}
                      </Button>
                    </td>
                  </tr>
                  {openId === c.id && (
                    <tr className="border-b border-border bg-card/40">
                      <td colSpan={7} className="px-4 py-4 text-muted-foreground">
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary/80">
                          {t("admin.users.referral")}
                        </p>
                        <p className="mt-1 font-mono text-xs">{c.referralCode}</p>

                        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-primary/80">
                          {t("admin.users.addressesHeading")}
                        </p>
                        <ul className="mt-2 list-inside list-disc text-sm">
                          {c.addresses.length === 0 ? (
                            <li>—</li>
                          ) : (
                            c.addresses.map((a) => (
                              <li key={a.id}>
                                {a.label}: {a.street}
                                {a.building ? `, ${a.building}` : ""} ({a.area})
                              </li>
                            ))
                          )}
                        </ul>
                        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-primary/80">
                          {t("admin.users.ordersHeading")}
                        </p>
                        <ul className="mt-2 list-inside list-disc text-sm">
                          {c.recentOrders.length === 0 ? (
                            <li>—</li>
                          ) : (
                            c.recentOrders.map((o) => (
                              <li key={o.id}>
                                {o.id.slice(0, 8)} — {formatKwd(o.total)} —{" "}
                                {o.status}
                              </li>
                            ))
                          )}
                        </ul>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
