"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { KUWAIT_GOVERNORATES } from "@/lib/kuwait-areas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/components/i18n/i18n-provider";
import { useCustomerAuth } from "@/components/auth/customer-auth-provider";
import { formatKwd } from "@/lib/format";
import { DELIVERY_AREAS } from "@/lib/delivery";
import { type TranslationKey } from "@/lib/dictionary";
import { orderStatusLabelKey } from "@/lib/order-status";
import { OrderStatus } from "@prisma/client";
import type { Locale } from "@/lib/i18n";
import type {
  CustomerAddress,
  CustomerOrderSummary,
  CustomerReward,
  CustomerWalletTxn,
} from "@/lib/customer-auth/types";
import {
  addCustomerAddress,
  deleteCustomerAddress,
} from "@/actions/customer-auth";
import { GiftCardRedeemPanel } from "@/components/account/gift-card-redeem-panel";
import { LoyaltyPanel } from "@/components/account/loyalty-panel";

function orderStatusLabel(
  status: string,
  fulfillment: string,
  t: (k: TranslationKey, vars?: Record<string, string | number>) => string
): string {
  return t(orderStatusLabelKey(status as OrderStatus, fulfillment));
}

export function AccountDashboard() {
  const { t, locale } = useI18n();
  const { user, logout, refreshUser } = useCustomerAuth();
  const router = useRouter();

  if (!user) return null;

  const memberSince = new Date(user.createdAtIso).toLocaleDateString(
    locale === "ar" ? "ar-KW" : "en-KW",
    { year: "numeric", month: "long", day: "numeric" }
  );

  async function onLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-12 sm:px-6">
      <header className="flex flex-col gap-6 border-b border-border/60 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            {t("account.kicker")}
          </p>
          <h1 className="mt-2 font-heading text-4xl">{t("account.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.fullName} · {user.email}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("account.tier.label")}{" "}
            <span className="font-semibold text-primary">
              {t(`account.tier.${user.tier.toLowerCase()}` as TranslationKey)}
            </span>{" "}
            · {t("account.referral.code")}:{" "}
            <span className="font-mono">{user.referralCode}</span>
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="shrink-0 gap-2 border-primary/40"
          onClick={onLogout}
        >
          <LogOut className="size-4" />
          {t("account.logout")}
        </Button>
      </header>

      <section
        id="profile"
        className="rounded-2xl border border-border/60 bg-card/40 p-6"
      >
        <h2 className="font-heading text-2xl">{t("account.tile.profile")}</h2>
        <Separator className="my-4 bg-border/60" />
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              {t("auth.field.fullName")}
            </dt>
            <dd className="mt-1 font-medium">{user.fullName}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              {t("auth.field.email")}
            </dt>
            <dd className="mt-1 font-medium">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              {t("auth.field.phone")}
            </dt>
            <dd className="mt-1 font-medium">{user.phone}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              {t("account.label.memberSince")}
            </dt>
            <dd className="mt-1 font-medium">{memberSince}</dd>
          </div>
        </dl>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section
          id="orders"
          className="rounded-2xl border border-border/60 bg-card/40 p-6"
        >
          <h2 className="font-heading text-2xl">{t("account.tile.orders")}</h2>
          <Separator className="my-4 bg-border/60" />
          <OrdersList orders={user.orders} t={t} />
        </section>

        <section
          id="addresses"
          className="rounded-2xl border border-border/60 bg-card/40 p-6"
        >
          <h2 className="font-heading text-2xl">
            {t("account.tile.addresses")}
          </h2>
          <Separator className="my-4 bg-border/60" />
          <AddressesList
            addresses={user.addresses}
            t={t}
            onRemove={async (id) => {
              const res = await deleteCustomerAddress(id);
              if (res.ok) {
                await refreshUser();
                toast.success(t("account.addresses.removed"));
              }
            }}
          />
          <AddAddressForm t={t} onAdded={refreshUser} />
        </section>

        <section
          id="points"
          className="rounded-2xl border border-border/60 bg-card/40 p-6 lg:col-span-2"
        >
          <h2 className="font-heading text-2xl">{t("account.tile.points")}</h2>
          <Separator className="my-4 bg-border/60" />
          <LoyaltyPanel
            balance={user.loyaltyPoints}
            lifetimePoints={user.lifetimePoints}
            expiringPoints={user.expiringPoints}
            minPointsToRedeem={user.minPointsToRedeem}
            redemptionPoints={user.redemptionPoints}
            redemptionValueKwd={user.redemptionValueKwd}
            loyaltyEnabled={user.loyaltyEnabled}
            rewards={user.rewardsHistory}
            codes={user.loyaltyRedemptionCodes}
            onUpdated={refreshUser}
          />
          <p className="mt-4 text-sm text-muted-foreground">
            <Link href="/loyalty" className="text-primary hover:underline">
              {t("account.points.ctaLoyalty")}
            </Link>
          </p>
        </section>

        <section
          id="rewards"
          className="hidden rounded-2xl border border-border/60 bg-card/40 p-6"
        >
          <h2 className="font-heading text-2xl">{t("account.tile.rewards")}</h2>
          <Separator className="my-4 bg-border/60" />
          <RewardsList rewards={user.rewardsHistory} t={t} locale={locale} />
        </section>

        <section
          id="wallet"
          className="rounded-2xl border border-border/60 bg-card/40 p-6 lg:col-span-2"
        >
          <h2 className="font-heading text-2xl">{t("account.tile.wallet")}</h2>
          <Separator className="my-4 bg-border/60" />
          <p className="font-heading text-3xl text-gradient-gold tabular-nums">
            {formatKwd(user.storeCreditKwd)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("account.wallet.note")}
          </p>
          <div className="mt-6">
            <GiftCardRedeemPanel onRedeemed={() => refreshUser()} />
          </div>
          <div className="mt-6">
            <h3 className="text-sm font-medium">{t("account.wallet.history")}</h3>
            <WalletHistoryList txns={user.walletHistory} t={t} locale={locale} />
          </div>
        </section>
      </div>
    </div>
  );
}

const ACTIVE_ORDER_STATUSES: string[] = [
  OrderStatus.PENDING,
  OrderStatus.PAID,
  OrderStatus.PREPARING,
  OrderStatus.OUT_FOR_DELIVERY,
];

function isActiveOrder(status: string): boolean {
  return ACTIVE_ORDER_STATUSES.includes(status);
}

function OrdersList({
  orders,
  t,
}: {
  orders: CustomerOrderSummary[];
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}) {
  if (orders.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("account.empty.orders")}</p>
    );
  }

  const activeOrders = orders.filter((o) => isActiveOrder(o.status));
  const previousOrders = orders.filter((o) => !isActiveOrder(o.status));

  return (
    <div className="space-y-6">
      {activeOrders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("account.orders.activeTitle")}
          </h3>
          <ul className="space-y-3">
            {activeOrders.map((o) => (
              <li
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {o.id.slice(0, 8)}…
                </span>
                <span className="text-muted-foreground">
                  {new Date(o.dateIso).toLocaleDateString()}
                </span>
                <span className="font-medium tabular-nums">
                  {formatKwd(o.totalKwd)}
                </span>
                <span className="text-xs font-medium text-primary">
                  {orderStatusLabel(o.status, o.fulfillmentType, t)}
                </span>
                <Link
                  href={`/orders/${o.id}`}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  {t("account.orders.track")}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("account.orders.previousTitle")}
        </h3>
        {previousOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("account.orders.noPrevious")}
          </p>
        ) : (
          <ul className="space-y-3">
            {previousOrders.map((o) => (
              <li
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/40 bg-background/30 px-4 py-3 text-sm"
              >
                <Link
                  href={`/orders/${o.id}`}
                  className="font-mono text-xs text-muted-foreground hover:text-primary"
                >
                  {o.id.slice(0, 8)}…
                </Link>
                <span className="text-muted-foreground">
                  {new Date(o.dateIso).toLocaleDateString()}
                </span>
                <span className="font-medium tabular-nums">
                  {formatKwd(o.totalKwd)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {orderStatusLabel(o.status, o.fulfillmentType, t)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AddAddressForm({
  t,
  onAdded,
}: {
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  onAdded: () => Promise<void> | void;
}) {
  const [open, setOpen] = React.useState(false);
  const [label, setLabel] = React.useState("");
  const [govKey, setGovKey] = React.useState(KUWAIT_GOVERNORATES[0]!.key);
  const governorate = KUWAIT_GOVERNORATES.find((g) => g.key === govKey);
  const [area, setArea] = React.useState(
    KUWAIT_GOVERNORATES[0]!.areas[0]!.key
  );
  const [street, setStreet] = React.useState("");
  const [avenue, setAvenue] = React.useState("");
  const [block, setBlock] = React.useState("");
  const [houseNumber, setHouseNumber] = React.useState("");
  const [floor, setFloor] = React.useState("");
  const [doorNumber, setDoorNumber] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [makeDefault, setMakeDefault] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!street.trim()) {
      toast.error(t("account.address.streetRequired"));
      return;
    }
    setBusy(true);
    const res = await addCustomerAddress({
      label: label.trim() || undefined,
      street: street.trim(),
      block: block.trim() || undefined,
      // Avenue is stored in the legacy "city" column.
      city: avenue.trim() || undefined,
      houseNumber: houseNumber.trim() || undefined,
      floor: floor.trim() || undefined,
      doorNumber: doorNumber.trim() || undefined,
      area,
      notes: notes.trim() || undefined,
      setDefault: makeDefault,
    });
    setBusy(false);
    if (res.ok) {
      toast.success(t("account.addresses.added"));
      setLabel("");
      setStreet("");
      setAvenue("");
      setBlock("");
      setHouseNumber("");
      setFloor("");
      setDoorNumber("");
      setNotes("");
      setMakeDefault(false);
      setOpen(false);
      await onAdded();
    } else {
      toast.error(t("account.address.saveFailed"));
    }
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        className="mt-4 rounded-xl"
        onClick={() => setOpen(true)}
      >
        + {t("account.addresses.add")}
      </Button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mt-4 space-y-3 rounded-2xl border border-border/60 bg-background/30 p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="addr-label">{t("account.address.label")}</Label>
          <Input
            id="addr-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t("account.address.label.placeholder")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="addr-gov">{t("checkout.address.governorate")}</Label>
          <select
            id="addr-gov"
            value={govKey}
            onChange={(e) => {
              setGovKey(e.target.value);
              const g = KUWAIT_GOVERNORATES.find(
                (x) => x.key === e.target.value
              );
              setArea(g?.areas[0]?.key ?? "");
            }}
            className="h-9 w-full rounded-lg border border-border/60 bg-card px-2 text-sm"
          >
            {KUWAIT_GOVERNORATES.map((g) => (
              <option key={g.key} value={g.key}>
                {g.nameEn}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="addr-area">{t("account.address.area")}</Label>
          <select
            id="addr-area"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="h-9 w-full rounded-lg border border-border/60 bg-card px-2 text-sm"
          >
            {(governorate?.areas ?? []).map((a) => (
              <option key={a.key} value={a.key}>
                {a.nameEn}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="addr-block">{t("checkout.address.block")}</Label>
          <Input
            id="addr-block"
            value={block}
            onChange={(e) => setBlock(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="addr-street">{t("account.address.street")}</Label>
          <Input
            id="addr-street"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder={t("account.address.street.placeholder")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="addr-avenue">
            {t("checkout.address.avenue")} ({t("checkout.optional")})
          </Label>
          <Input
            id="addr-avenue"
            value={avenue}
            onChange={(e) => setAvenue(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="addr-house">{t("checkout.address.houseNumber")}</Label>
          <Input
            id="addr-house"
            value={houseNumber}
            onChange={(e) => setHouseNumber(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="addr-floor">
            {t("checkout.address.floor")} ({t("checkout.optional")})
          </Label>
          <Input
            id="addr-floor"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="addr-door">
            {t("checkout.address.doorNumber")} ({t("checkout.optional")})
          </Label>
          <Input
            id="addr-door"
            value={doorNumber}
            onChange={(e) => setDoorNumber(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="addr-notes">{t("account.address.notes")}</Label>
        <Textarea
          id="addr-notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("account.address.notes.placeholder")}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={makeDefault}
          onChange={(e) => setMakeDefault(e.target.checked)}
          className="size-4 accent-[var(--primary)]"
        />
        {t("account.address.default")}
      </label>
      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          className="flex-1"
          onClick={() => setOpen(false)}
          disabled={busy}
        >
          {t("account.address.cancel")}
        </Button>
        <Button type="submit" className="flex-1 rounded-xl" disabled={busy}>
          {t("account.address.save")}
        </Button>
      </div>
    </form>
  );
}

function AddressesList({
  addresses,
  t,
  onRemove,
}: {
  addresses: CustomerAddress[];
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  onRemove: (id: string) => Promise<void>;
}) {
  if (addresses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("account.empty.addresses")}
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {addresses.map((a) => (
        <li
          key={a.id}
          className="flex items-start justify-between gap-3 rounded-xl border border-border/40 bg-background/30 px-4 py-3 text-sm"
        >
          <div>
            <p className="font-medium">{a.label}</p>
            <p className="text-muted-foreground">{a.street}</p>
            {a.building ? (
              <p className="text-muted-foreground">{a.building}</p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              {DELIVERY_AREAS.find((x) => x.id === a.deliveryAreaId)?.label ??
                a.deliveryAreaId}
            </p>
            {a.additionalNotes ? (
              <p className="mt-1 text-xs text-muted-foreground">{a.additionalNotes}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onRemove(a.id)}
            className="shrink-0 rounded-md p-1 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
            aria-label={t("account.addresses.remove")}
            title={t("account.addresses.remove")}
          >
            <Trash2 className="size-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}

function RewardsList({
  rewards,
  t,
  locale,
}: {
  rewards: CustomerReward[];
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  locale: Locale;
}) {
  if (rewards.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("account.empty.rewards")}
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {rewards.map((r) => (
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
      ))}
    </ul>
  );
}

function WalletHistoryList({
  txns,
  t,
  locale,
}: {
  txns: CustomerWalletTxn[];
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  locale: Locale;
}) {
  if (txns.length === 0) {
    return (
      <p className="mt-2 text-sm text-muted-foreground">
        {t("account.wallet.emptyHistory")}
      </p>
    );
  }
  return (
    <ul className="mt-3 space-y-2">
      {txns.map((txn) => (
        <li
          key={txn.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/30 px-4 py-3 text-sm"
        >
          <div>
            <p>{txn.reason}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(txn.dateIso).toLocaleDateString(
                locale === "ar" ? "ar-KW" : "en-KW"
              )}
            </p>
          </div>
          <div className="text-end">
            <p
              className={`font-medium tabular-nums ${
                txn.amountKwd >= 0 ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {txn.amountKwd >= 0 ? "+" : ""}
              {formatKwd(txn.amountKwd)}
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {t("account.wallet.balanceAfter", {
                amount: formatKwd(txn.balanceAfterKwd),
              })}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

