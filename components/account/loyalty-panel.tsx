"use client";

import * as React from "react";
import { toast } from "sonner";
import { Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/components/i18n/i18n-provider";
import { formatKwd } from "@/lib/format";
import { type TranslationKey } from "@/lib/dictionary";
import type {
  CustomerLoyaltyCode,
  CustomerReward,
} from "@/lib/customer-auth/types";
import { redeemLoyaltyPointsForCode } from "@/actions/loyalty-redeem";

type HistoryFilter = "all" | "earned" | "spent" | "expired";

type Props = {
  balance: number;
  lifetimePoints: number;
  expiringPoints: number;
  minPointsToRedeem: number;
  redemptionPoints: number;
  redemptionValueKwd: number;
  loyaltyEnabled: boolean;
  rewards: CustomerReward[];
  codes: CustomerLoyaltyCode[];
  onUpdated: () => Promise<void>;
};

const EARN_TYPES = new Set([
  "EARN_ORDER",
  "EARN_BONUS_FIRST_ORDER",
  "EARN_BONUS_BIRTHDAY",
  "EARN_BONUS_REFERRAL",
  "EARN_BONUS_CAMPAIGN",
  "ADJUST_ADMIN",
]);

export function LoyaltyPanel({
  balance,
  lifetimePoints,
  expiringPoints,
  minPointsToRedeem,
  redemptionPoints,
  redemptionValueKwd,
  loyaltyEnabled,
  rewards,
  codes,
  onUpdated,
}: Props) {
  const { t, locale } = useI18n();
  const [filter, setFilter] = React.useState<HistoryFilter>("all");
  const [pointsInput, setPointsInput] = React.useState(
    String(minPointsToRedeem)
  );
  const [pending, setPending] = React.useState(false);

  const filtered = rewards.filter((r) => {
    if (filter === "all") return true;
    if (filter === "earned") return r.points > 0 && r.type !== "EXPIRE";
    if (filter === "spent") return r.points < 0 && r.type !== "EXPIRE";
    if (filter === "expired") return r.type === "EXPIRE";
    return true;
  });

  async function onRedeem() {
    const points = Number(pointsInput);
    if (!Number.isFinite(points) || points <= 0) {
      toast.error(t("account.loyalty.redeem.error.invalid"));
      return;
    }
    setPending(true);
    const res = await redeemLoyaltyPointsForCode({ points });
    setPending(false);
    if (!res.ok) {
      toast.error(
        t(`account.loyalty.redeem.error.${res.error}` as TranslationKey)
      );
      return;
    }
    toast.success(
      t("account.loyalty.redeem.success", {
        code: res.code,
        amount: formatKwd(res.valueKwd),
      })
    );
    setPointsInput("");
    await onUpdated();
  }

  function copyCode(code: string) {
    void navigator.clipboard.writeText(code);
    toast.success(t("account.loyalty.codeCopied"));
  }

  const filters: { id: HistoryFilter; label: TranslationKey }[] = [
    { id: "all", label: "account.loyalty.filter.all" },
    { id: "earned", label: "account.loyalty.filter.earned" },
    { id: "spent", label: "account.loyalty.filter.spent" },
    { id: "expired", label: "account.loyalty.filter.expired" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="font-heading text-3xl text-gradient-gold tabular-nums">
          {t("account.points.balance", { points: balance })}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("account.points.lifetime", { points: lifetimePoints })}
        </p>
        {expiringPoints > 0 ? (
          <p className="mt-3 rounded-lg border border-border bg-primary/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
            {t("account.loyalty.expiringNotice", { points: expiringPoints })}
          </p>
        ) : null}
      </div>

      {!loyaltyEnabled ? (
        <p className="text-sm text-muted-foreground">
          {t("account.loyalty.disabled")}
        </p>
      ) : balance >= minPointsToRedeem ? (
        <div className="rounded-xl border border-border/50 bg-background/30 p-4">
          <p className="text-sm font-medium">{t("account.loyalty.redeem.title")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("account.loyalty.redeem.rate", {
              points: redemptionPoints,
              amount: formatKwd(redemptionValueKwd),
            })}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="space-y-1">
              <Label htmlFor="redeem-points">
                {t("account.loyalty.redeem.points")}
              </Label>
              <Input
                id="redeem-points"
                type="number"
                min={minPointsToRedeem}
                step={redemptionPoints}
                value={pointsInput}
                onChange={(e) => setPointsInput(e.target.value)}
                placeholder={String(minPointsToRedeem)}
              />
            </div>
            <Button
              type="button"
              className="self-end"
              disabled={pending}
              onClick={onRedeem}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                t("account.loyalty.redeem.cta")
              )}
            </Button>
          </div>
        </div>
      ) : null}

      {codes.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium">{t("account.loyalty.codes.title")}</h3>
          <ul className="mt-3 space-y-2">
            {codes.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/40 bg-background/30 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-mono font-medium">{c.code}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("account.loyalty.codes.balance", {
                      amount: formatKwd(c.balanceKwd),
                    })}
                    {c.expiresAtIso
                      ? ` · ${new Date(c.expiresAtIso).toLocaleDateString(
                          locale === "ar" ? "ar-KW" : "en-KW"
                        )}`
                      : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => copyCode(c.code)}
                >
                  <Copy className="size-3.5" />
                  {t("account.loyalty.codes.copy")}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                filter === f.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t(f.label)}
            </button>
          ))}
        </div>
        <ul className="mt-4 space-y-3">
          {filtered.length === 0 ? (
            <li className="text-sm text-muted-foreground">
              {t("account.empty.rewards")}
            </li>
          ) : (
            filtered.map((r) => (
              <li
                key={r.id}
                className="flex justify-between gap-4 rounded-xl border border-border/40 bg-background/30 px-4 py-3 text-sm"
              >
                <div>
                  <p>{r.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.dateIso).toLocaleDateString(
                      locale === "ar" ? "ar-KW" : "en-KW"
                    )}
                    {r.expiresAtIso && EARN_TYPES.has(r.type)
                      ? ` · ${t("account.loyalty.expires", {
                          date: new Date(r.expiresAtIso).toLocaleDateString(
                            locale === "ar" ? "ar-KW" : "en-KW"
                          ),
                        })}`
                      : ""}
                  </p>
                </div>
                <span
                  className={`shrink-0 font-medium tabular-nums ${
                    r.points >= 0 ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {r.points >= 0
                    ? t("account.reward.pointsLabel", { points: r.points })
                    : t("account.reward.pointsLabelNeg", { points: r.points })}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
