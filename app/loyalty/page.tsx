import { getLocale } from "@/lib/i18n-server";
import { translate, type TranslationKey } from "@/lib/dictionary";
import { getLoyaltySettings } from "@/lib/loyalty-settings";
import { formatKwd } from "@/lib/format";

export const metadata = {
  title: "Loyalty Program",
  description: "Learn how to earn and redeem points at Al Aridi Sweets.",
};

export default async function LoyaltyPage() {
  const locale = await getLocale();
  const t = (
    key: TranslationKey,
    vars?: Record<string, string | number>
  ) => translate(locale, key, vars);
  const settings = await getLoyaltySettings();

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-12 sm:px-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          {t("loyalty.kicker")}
        </p>
        <h1 className="mt-2 font-heading text-4xl">{t("loyalty.title")}</h1>
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

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
          <h2 className="font-heading text-2xl">{t("loyalty.tier.silver")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("loyalty.tier.silver.range", {
              threshold: settings.goldThreshold,
            })}
          </p>
          <p className="mt-2 text-sm font-medium text-primary">
            {t("loyalty.tier.earnRate", { rate: settings.silverEarnPercent })}
          </p>
        </div>
        <div className="rounded-2xl border border-primary/30 bg-secondary/30 p-5">
          <h2 className="font-heading text-2xl">{t("loyalty.tier.gold")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("loyalty.tier.gold.range", {
              min: settings.goldThreshold,
              max: settings.platinumThreshold,
            })}
          </p>
          <p className="mt-2 text-sm font-medium text-primary">
            {t("loyalty.tier.earnRate", { rate: settings.goldEarnPercent })}
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
          <h2 className="font-heading text-2xl">{t("loyalty.tier.platinum")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("loyalty.tier.platinum.range", {
              threshold: settings.platinumThreshold,
            })}
          </p>
          <p className="mt-2 text-sm font-medium text-primary">
            {t("loyalty.tier.earnRate", { rate: settings.platinumEarnPercent })}
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
          <h3 className="font-heading text-2xl">{t("loyalty.earn.title")}</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>{t("loyalty.earn.li1")}</li>
            <li>
              {t("loyalty.earn.li2", {
                points: settings.firstOrderBonusPoints,
              })}
            </li>
            <li>{t("loyalty.earn.li3")}</li>
            <li>
              {t("loyalty.earn.expiry", { days: settings.pointsExpiryDays })}
            </li>
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
