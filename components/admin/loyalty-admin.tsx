"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useI18n } from "@/components/i18n/i18n-provider";
import { formatKwd } from "@/lib/format";
import {
  getCustomerLoyaltyAdmin,
  updateLoyaltySettings,
  type CustomerLoyaltyAdminDetail,
  type LoyaltySettingsInput,
} from "@/actions/loyalty-admin";
import { searchCustomersForLoyalty } from "@/actions/loyalty-admin";

type HistoryFilter = "all" | "earned" | "spent" | "expired";

type Props = {
  settings: LoyaltySettingsInput;
  tierCounts: { tier: string; count: number }[];
  dbOffline: boolean;
};

export function LoyaltyAdmin({ settings: initial, tierCounts, dbOffline }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const [settings, setSettings] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [matches, setMatches] = React.useState<
    { id: string; name: string; email: string; tier: string; loyaltyBalance: number }[]
  >([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [customerDetail, setCustomerDetail] =
    React.useState<CustomerLoyaltyAdminDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = React.useState(false);
  const [historyFilter, setHistoryFilter] =
    React.useState<HistoryFilter>("all");

  function setNum(key: keyof LoyaltySettingsInput, value: string) {
    const n = Number(value);
    setSettings((s) => ({ ...s, [key]: Number.isFinite(n) ? n : 0 }));
  }

  async function onSave() {
    setSaving(true);
    try {
      await updateLoyaltySettings(settings);
      toast.success(t("admin.loyalty.saved"));
      router.refresh();
    } catch {
      toast.error(t("admin.loyalty.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function onSearch() {
    if (!search.trim()) return;
    setSearching(true);
    try {
      const rows = await searchCustomersForLoyalty(search.trim());
      setMatches(rows);
      setSelectedId(null);
      setCustomerDetail(null);
    } catch {
      toast.error(t("admin.loyalty.searchFailed"));
    } finally {
      setSearching(false);
    }
  }

  async function loadCustomer(id: string) {
    setSelectedId(id);
    setHistoryFilter("all");
    setLoadingDetail(true);
    try {
      const detail = await getCustomerLoyaltyAdmin(id);
      setCustomerDetail(detail);
    } catch {
      toast.error(t("admin.loyalty.customerLoadFailed"));
      setCustomerDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }

  const tiers = ["SILVER", "GOLD", "PLATINUM"] as const;

  return (
    <div className="space-y-8">
      {dbOffline ? (
        <p className="rounded-lg border border-border bg-primary/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          {t("admin.products.dbOffline")}
        </p>
      ) : null}

      <section className="rounded-2xl border border-border bg-card/40 p-5">
        <h2 className="font-heading text-xl text-foreground">
          {t("admin.loyalty.settings.title")}
        </h2>
        <label className="mt-4 flex items-center gap-2 text-sm text-foreground">
          <Checkbox
            checked={settings.enabled}
            onCheckedChange={(v) =>
              setSettings((s) => ({ ...s, enabled: v === true }))
            }
          />
          {t("admin.loyalty.settings.enabled")}
        </label>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label={t("admin.loyalty.settings.expiryDays")}
            value={String(settings.pointsExpiryDays)}
            onChange={(v) => setNum("pointsExpiryDays", v)}
          />
          <Field
            label={t("admin.loyalty.settings.silverRate")}
            value={String(settings.silverEarnPercent)}
            onChange={(v) => setNum("silverEarnPercent", v)}
          />
          <Field
            label={t("admin.loyalty.settings.goldRate")}
            value={String(settings.goldEarnPercent)}
            onChange={(v) => setNum("goldEarnPercent", v)}
          />
          <Field
            label={t("admin.loyalty.settings.platinumRate")}
            value={String(settings.platinumEarnPercent)}
            onChange={(v) => setNum("platinumEarnPercent", v)}
          />
          <Field
            label={t("admin.loyalty.settings.redemptionPoints")}
            value={String(settings.redemptionPoints)}
            onChange={(v) => setNum("redemptionPoints", v)}
          />
          <Field
            label={t("admin.loyalty.settings.redemptionKwd")}
            value={String(settings.redemptionValueKwd)}
            onChange={(v) => setNum("redemptionValueKwd", v)}
          />
          <Field
            label={t("admin.loyalty.settings.minRedeem")}
            value={String(settings.minPointsToRedeem)}
            onChange={(v) => setNum("minPointsToRedeem", v)}
          />
          <Field
            label={t("admin.loyalty.settings.firstOrderBonus")}
            value={String(settings.firstOrderBonusPoints)}
            onChange={(v) => setNum("firstOrderBonusPoints", v)}
          />
          <Field
            label={t("admin.loyalty.settings.birthdayBonus")}
            value={String(settings.birthdayBonusPoints)}
            onChange={(v) => setNum("birthdayBonusPoints", v)}
          />
          <Field
            label={t("admin.loyalty.settings.referralBonus")}
            value={String(settings.referralBonusPoints)}
            onChange={(v) => setNum("referralBonusPoints", v)}
          />
          <Field
            label={t("admin.loyalty.settings.goldThreshold")}
            value={String(settings.goldThreshold)}
            onChange={(v) => setNum("goldThreshold", v)}
          />
          <Field
            label={t("admin.loyalty.settings.platinumThreshold")}
            value={String(settings.platinumThreshold)}
            onChange={(v) => setNum("platinumThreshold", v)}
          />
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          {t("admin.loyalty.settings.redeemHint", {
            points: settings.redemptionPoints,
            amount: formatKwd(settings.redemptionValueKwd),
          })}
        </p>

        <Button
          type="button"
          className="mt-4"
          disabled={saving || dbOffline}
          onClick={onSave}
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : t("admin.promos.save")}
        </Button>
      </section>

      <section className="rounded-2xl border border-border bg-card/40 p-5">
        <h2 className="font-heading text-xl text-foreground">
          {t("admin.loyalty.tiers.title")}
        </h2>
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-start">{t("admin.loyalty.tier")}</th>
                <th className="px-3 py-2 text-start">
                  {t("admin.loyalty.settings.earnPercent")}
                </th>
                <th className="px-3 py-2 text-start">{t("admin.loyalty.customers")}</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier) => {
                const row = tierCounts.find((c) => c.tier === tier);
                const rate =
                  tier === "GOLD"
                    ? settings.goldEarnPercent
                    : tier === "PLATINUM"
                      ? settings.platinumEarnPercent
                      : settings.silverEarnPercent;
                return (
                  <tr key={tier} className="border-t border-border">
                    <td className="px-3 py-2 text-foreground">{tier}</td>
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">
                      {rate}%
                    </td>
                    <td className="px-3 py-2 tabular-nums text-foreground">
                      {row?.count ?? 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card/40 p-5">
        <h2 className="font-heading text-xl text-foreground">
          {t("admin.loyalty.customerLookup")}
        </h2>
        <div className="mt-4 flex gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.loyalty.searchPlaceholder")}
            className="max-w-md border-border bg-card"
          />
          <Button
            type="button"
            variant="outline"
            disabled={searching || dbOffline}
            onClick={onSearch}
          >
            {searching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
          </Button>
        </div>

        {matches.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {matches.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => loadCustomer(c.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-start text-sm transition ${
                    selectedId === c.id
                      ? "border-primary/50 bg-primary/10"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <span className="text-foreground">{c.name}</span>
                  <span className="mx-2 text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{c.email}</span>
                  <span className="mx-2 text-muted-foreground">·</span>
                  <span className="text-primary">{c.tier}</span>
                  <span className="mx-2 text-muted-foreground">·</span>
                  <span className="tabular-nums text-foreground">
                    {c.loyaltyBalance} pts
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {loadingDetail ? (
          <div className="mt-6 flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : customerDetail ? (
          <div className="mt-6 space-y-4">
            <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <Stat
                label={t("admin.loyalty.customer.balance")}
                value={`${customerDetail.customer.loyaltyBalance} pts`}
              />
              <Stat
                label={t("admin.loyalty.customer.lifetime")}
                value={`${customerDetail.customer.lifetimePoints} pts`}
              />
              <Stat
                label={t("admin.loyalty.customer.wallet")}
                value={formatKwd(customerDetail.customer.storeCreditKwd)}
              />
              <Stat
                label={t("admin.loyalty.tier")}
                value={customerDetail.customer.tier}
              />
              <Stat
                label={t("admin.loyalty.customer.earned")}
                value={`${customerDetail.stats.earned} pts`}
              />
              <Stat
                label={t("admin.loyalty.customer.spent")}
                value={`${customerDetail.stats.spent} pts`}
              />
              <Stat
                label={t("admin.loyalty.customer.expired")}
                value={`${customerDetail.stats.expired} pts`}
              />
            </dl>

            <div>
              <h3 className="text-sm font-medium text-foreground">
                {t("admin.loyalty.customer.history")}
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    ["all", "admin.loyalty.filter.all"],
                    ["earned", "admin.loyalty.filter.earned"],
                    ["spent", "admin.loyalty.filter.spent"],
                    ["expired", "admin.loyalty.filter.expired"],
                  ] as const
                ).map(([id, labelKey]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setHistoryFilter(id)}
                    className={`rounded-full px-3 py-1 text-xs transition ${
                      historyFilter === id
                        ? "bg-primary/20 text-primary"
                        : "border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t(labelKey)}
                  </button>
                ))}
              </div>
              <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto text-sm">
                {customerDetail.txns
                  .filter((tx) => {
                    if (historyFilter === "all") return true;
                    if (historyFilter === "earned") {
                      return tx.points > 0 && tx.type !== "EXPIRE";
                    }
                    if (historyFilter === "spent") {
                      return tx.points < 0 && tx.type !== "EXPIRE";
                    }
                    return tx.type === "EXPIRE";
                  })
                  .map((tx) => (
                  <li
                    key={tx.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2"
                  >
                    <span className="text-xs text-muted-foreground">
                      {new Date(tx.createdAtIso).toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">{tx.type}</span>
                    <span className="max-w-[200px] truncate text-muted-foreground">
                      {tx.reason}
                    </span>
                    <span
                      className={`tabular-nums ${
                        tx.points >= 0 ? "text-emerald-300" : "text-red-300"
                      }`}
                    >
                      {tx.points >= 0 ? `+${tx.points}` : tx.points}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {customerDetail.codes.length > 0 ? (
              <div>
                <h3 className="text-sm font-medium text-foreground">
                  {t("admin.loyalty.customer.codes")}
                </h3>
                <ul className="mt-2 space-y-1 text-sm">
                  {customerDetail.codes.map((c) => (
                    <li key={c.id} className="text-muted-foreground">
                      <span className="font-mono text-foreground">{c.code}</span>
                      {" · "}
                      {formatKwd(c.balanceKwd)} · {c.status}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-border bg-card text-foreground"
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card/40 p-3">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-base text-primary">{value}</p>
    </div>
  );
}
