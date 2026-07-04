import Link from "next/link";
import { Coins, Gift, Trophy, Crown, Medal, Star, ArrowRight } from "lucide-react";
import { getLocale } from "@/lib/i18n-server";
import { translate, type TranslationKey } from "@/lib/dictionary";
import { getLoyaltySettings } from "@/lib/loyalty-settings";
import { getCurrentCustomer } from "@/lib/customer-auth/server";
import { formatKwd } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Loyalty Program",
  description: "Learn how to earn and redeem points at Al Aridi Sweets.",
};

const TIER_ICON = { SILVER: Medal, GOLD: Star, PLATINUM: Crown } as const;
const TIER_LABEL_KEY: Record<"SILVER" | "GOLD" | "PLATINUM", TranslationKey> = {
  SILVER: "loyalty.tier.silver",
  GOLD: "loyalty.tier.gold",
  PLATINUM: "loyalty.tier.platinum",
};

export default async function LoyaltyPage() {
  const locale = await getLocale();
  const t = (key: TranslationKey, vars?: Record<string, string | number>) =>
    translate(locale, key, vars);
  const [settings, customer] = await Promise.all([
    getLoyaltySettings(),
    getCurrentCustomer(),
  ]);

  // Points → KWD value + progress toward the next tier.
  const points = customer?.loyaltyPoints ?? 0;
  const lifetime = customer?.lifetimePoints ?? 0;
  const tier = customer?.tier ?? "SILVER";
  const kwdValue =
    (points / settings.redemptionPoints) * settings.redemptionValueKwd;

  let nextTierKey: TranslationKey | null = null;
  let pointsToNext = 0;
  let progressPct = 100;
  if (tier === "SILVER") {
    nextTierKey = "loyalty.tier.gold";
    pointsToNext = Math.max(0, settings.goldThreshold - lifetime);
    progressPct = Math.min(100, (lifetime / settings.goldThreshold) * 100);
  } else if (tier === "GOLD") {
    nextTierKey = "loyalty.tier.platinum";
    pointsToNext = Math.max(0, settings.platinumThreshold - lifetime);
    const span = settings.platinumThreshold - settings.goldThreshold;
    progressPct = Math.min(
      100,
      ((lifetime - settings.goldThreshold) / span) * 100
    );
  }

  const TierIcon = TIER_ICON[tier];

  const HOW = [
    { icon: Coins, key: "collect" },
    { icon: Gift, key: "redeem" },
    { icon: Trophy, key: "rewards" },
  ] as const;

  const TIERS = [
    {
      id: "SILVER" as const,
      rangeKey: "loyalty.tier.silver.range" as TranslationKey,
      rangeVars: { threshold: settings.goldThreshold },
      rate: settings.silverEarnPercent,
    },
    {
      id: "GOLD" as const,
      rangeKey: "loyalty.tier.gold.range" as TranslationKey,
      rangeVars: {
        min: settings.goldThreshold,
        max: settings.platinumThreshold,
      },
      rate: settings.goldEarnPercent,
    },
    {
      id: "PLATINUM" as const,
      rangeKey: "loyalty.tier.platinum.range" as TranslationKey,
      rangeVars: { threshold: settings.platinumThreshold },
      rate: settings.platinumEarnPercent,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-12 sm:px-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          {t("loyalty.kicker")}
        </p>
        <h1 className="mt-2 font-heading text-4xl leading-[1.05] sm:text-5xl">
          {t("loyalty.title")}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {t("loyalty.rate", {
            points: settings.redemptionPoints,
            amount: formatKwd(settings.redemptionValueKwd),
          })}
        </p>
        {!settings.enabled ? (
          <p className="mt-2 text-sm text-primary">{t("loyalty.disabled")}</p>
        ) : null}
      </header>

      {/* Points hero card */}
      <section className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/15 via-card/70 to-background p-6 shadow-[0_28px_70px_-40px_rgba(120,80,20,0.6)] sm:p-8">
        <div
          aria-hidden
          className="glow-radial pointer-events-none absolute inset-x-0 -top-24 h-48"
        />
        {customer ? (
          <div className="relative">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                  {t("loyalty.points.title")}
                </p>
                <p className="mt-2 flex items-baseline gap-2">
                  <span className="font-heading text-5xl leading-none text-foreground sm:text-6xl">
                    {points.toLocaleString(locale === "ar" ? "ar-KW" : "en-US")}
                  </span>
                  <span className="text-sm font-semibold uppercase tracking-widest text-primary">
                    {t("loyalty.points.unit")}
                  </span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("loyalty.points.worth", { amount: formatKwd(kwdValue) })}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2">
                <TierIcon className="size-5 text-primary" />
                <span className="font-heading text-lg text-primary">
                  {t(TIER_LABEL_KEY[tier])}
                </span>
              </div>
            </div>

            {/* Progress to next tier */}
            <div className="mt-6">
              {nextTierKey ? (
                <>
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {t("loyalty.points.lifetime", { points: lifetime })}
                    </span>
                    <span className="text-primary">
                      {t("loyalty.points.toNext", {
                        points: pointsToNext,
                        tier: t(nextTierKey),
                      })}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-primary/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-primary">
                  {t("loyalty.points.topTier")}
                </p>
              )}
            </div>

            <Link
              href="/account"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-105"
            >
              {t("loyalty.points.viewAccount")}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
          </div>
        ) : (
          <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5">
                <Coins className="size-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                  {t("loyalty.points.title")}
                </span>
              </div>
              <h2 className="mt-3 font-heading text-2xl sm:text-3xl">
                {t("loyalty.points.guestTitle")}
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {t("loyalty.points.guestBody")}
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-105"
            >
              {t("nav.auth.login")}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
          </div>
        )}
      </section>

      {/* How it works */}
      <section>
        <h2 className="font-heading text-2xl sm:text-3xl">
          {t("loyalty.how.title")}
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {HOW.map(({ icon: Icon, key }) => (
            <div
              key={key}
              className="rounded-2xl border border-border/55 bg-card/40 p-5"
            >
              <span className="inline-flex size-12 items-center justify-center rounded-xl border border-primary/30 text-primary">
                <Icon className="size-6" strokeWidth={1.4} />
              </span>
              <h3 className="mt-4 font-heading text-lg">
                {t(`loyalty.how.${key}.title` as TranslationKey)}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(`loyalty.how.${key}.body` as TranslationKey)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Tiers */}
      <section>
        <h2 className="font-heading text-2xl sm:text-3xl">
          {t("loyalty.points.currentTier")}
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {TIERS.map((tierItem) => {
            const Icon = TIER_ICON[tierItem.id];
            const active = customer != null && tier === tierItem.id;
            return (
              <div
                key={tierItem.id}
                className={cn(
                  "rounded-2xl border p-5 transition",
                  active
                    ? "border-primary/60 bg-primary/[0.08] shadow-[0_0_0_1px_rgba(201,169,110,0.25)]"
                    : "border-border/60 bg-card/40"
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    className={cn(
                      "size-5",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <h3 className="font-heading text-2xl">
                    {t(TIER_LABEL_KEY[tierItem.id])}
                  </h3>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(tierItem.rangeKey, tierItem.rangeVars)}
                </p>
                <p className="mt-3 text-sm font-medium text-primary">
                  {t("loyalty.tier.earnRate", { rate: tierItem.rate })}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Earn / Redeem details */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
          <h3 className="font-heading text-2xl">{t("loyalty.earn.title")}</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>{t("loyalty.earn.li1")}</li>
            <li>
              {t("loyalty.earn.li2", { points: settings.firstOrderBonusPoints })}
            </li>
            <li>{t("loyalty.earn.li3")}</li>
            <li>{t("loyalty.earn.expiry", { days: settings.pointsExpiryDays })}</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
          <h3 className="font-heading text-2xl">{t("loyalty.redeem.title")}</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              {t("loyalty.redeem.li1", {
                points: settings.redemptionPoints,
                amount: formatKwd(settings.redemptionValueKwd),
              })}
            </li>
            <li>{t("loyalty.redeem.li2")}</li>
            <li>{t("loyalty.redeem.li3")}</li>
            <li>{t("loyalty.redeem.li4")}</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
