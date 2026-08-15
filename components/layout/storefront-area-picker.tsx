"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useI18n } from "@/components/i18n/i18n-provider";
import {
  KUWAIT_GOVERNORATES,
  type SelectedKuwaitArea,
} from "@/lib/kuwait-areas";
import { setStorefrontArea } from "@/actions/storefront-area";
import {
  clearStorefrontPickupBranch,
  setStorefrontPickupBranch,
} from "@/actions/storefront-pickup-branch";
import type { PickupBranchOption } from "@/lib/pickup-branch";
import { cn } from "@/lib/utils";

export type ServedArea = { governorateKey: string; areaKey: string };

type Props = {
  selected: SelectedKuwaitArea | null;
  areaLabel: string | null;
  /** Areas at least one branch delivers to. Empty = show the full list. */
  servedAreas?: ServedArea[];
  /** Branches offered for pickup. */
  pickupBranches?: PickupBranchOption[];
  /** Open the picker automatically once per visit. */
  promptOnMount?: boolean;
  className?: string;
};

export function StorefrontAreaPicker({
  selected,
  areaLabel,
  servedAreas = [],
  pickupBranches = [],
  promptOnMount = false,
  className,
}: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);

  // Filter the static list down to what admin has enabled for delivery.
  // If nothing is configured yet, fall back to the full list so the site works.
  const hasConfig = servedAreas.length > 0;
  const servedSet = React.useMemo(
    () => new Set(servedAreas.map((s) => `${s.governorateKey}:${s.areaKey}`)),
    [servedAreas]
  );
  const governorates = React.useMemo(() => {
    if (!hasConfig) return KUWAIT_GOVERNORATES;
    return KUWAIT_GOVERNORATES.map((g) => ({
      ...g,
      areas: g.areas.filter((a) => servedSet.has(`${g.key}:${a.key}`)),
    })).filter((g) => g.areas.length > 0);
  }, [hasConfig, servedSet]);

  const [open, setOpen] = React.useState(false);
  const [govKey, setGovKey] = React.useState(
    selected?.governorateKey ?? governorates[0]?.key ?? KUWAIT_GOVERNORATES[0]!.key
  );
  const [areaKey, setAreaKey] = React.useState(selected?.areaKey ?? "");

  React.useEffect(() => {
    if (selected?.areaKey) setAreaKey(selected.areaKey);
  }, [selected?.areaKey]);

  const [mode, setMode] = React.useState<"delivery" | "pickup">("delivery");
  const [pickupBranchId, setPickupBranchId] = React.useState(
    pickupBranches[0]?.id ?? ""
  );

  // Ask once per visit (per browser session), even for returning customers.
  React.useEffect(() => {
    if (!promptOnMount) return;
    try {
      if (sessionStorage.getItem("aa-area-prompted")) return;
      sessionStorage.setItem("aa-area-prompted", "1");
    } catch {
      // sessionStorage unavailable — still prompt
    }
    setOpen(true);
  }, [promptOnMount]);

  React.useEffect(() => {
    if (selected?.governorateKey) setGovKey(selected.governorateKey);
  }, [selected?.governorateKey]);

  // Keep the selected governorate valid against the available list.
  React.useEffect(() => {
    if (!governorates.some((g) => g.key === govKey)) {
      setGovKey(governorates[0]?.key ?? "");
    }
  }, [governorates, govKey]);

  const governorate = governorates.find((g) => g.key === govKey);

  async function onSelectArea(areaKey: string) {
    setSaving(true);
    const res = await setStorefrontArea(govKey, areaKey);
    if (res.ok) {
      // Delivery chosen — drop any previous pickup branch so the menu
      // follows the branch that serves this area.
      await clearStorefrontPickupBranch();
    }
    setSaving(false);
    if (!res.ok) return;
    setOpen(false);
    router.refresh();
  }

  async function onSelectPickup() {
    if (!pickupBranchId) return;
    setSaving(true);
    const res = await setStorefrontPickupBranch(pickupBranchId);
    setSaving(false);
    if (!res.ok) return;
    setOpen(false);
    router.refresh();
  }

  const label =
    areaLabel ??
    (selected ? t("area.picker.deliverTo") : t("area.picker.choose"));

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "max-w-[2.75rem] min-h-11 min-w-11 shrink-0 gap-1.5 truncate px-2 text-muted-foreground hover:text-foreground sm:max-w-[240px] sm:px-2",
          className
        )}
        onClick={() => setOpen(true)}
        aria-label={t("area.picker.choose")}
      >
        <MapPin className="size-4 shrink-0 text-primary" />
        <span className="hidden truncate text-xs sm:inline sm:text-sm">
          {selected ? (
            <>
              <span className="hidden text-muted-foreground sm:inline">
                {t("area.picker.deliverTo")}{" "}
              </span>
              {label}
            </>
          ) : (
            t("area.picker.choose")
          )}
        </span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-border bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("area.picker.dialogTitle")}</DialogTitle>
            <DialogDescription>{t("area.picker.dialogSubtitle")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("delivery")}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-sm font-medium transition",
                  mode === "delivery"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                {t("checkout.fulfillment.delivery")}
              </button>
              <button
                type="button"
                onClick={() => setMode("pickup")}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-sm font-medium transition",
                  mode === "pickup"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                {t("checkout.fulfillment.pickup")}
              </button>
            </div>

            {mode === "pickup" ? (
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("checkout.pickup.branch")}
                  </p>
                  <select
                    value={pickupBranchId}
                    onChange={(e) => setPickupBranchId(e.target.value)}
                    className="h-11 w-full rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground"
                  >
                    {pickupBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {locale === "ar" ? b.nameAr : b.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  className="w-full rounded-xl"
                  disabled={saving || !pickupBranchId}
                  onClick={() => void onSelectPickup()}
                >
                  {saving ? "…" : t("checkout.fulfillment.pickup")}
                </Button>
              </div>
            ) : (
            <>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("area.picker.governorate")}
              </p>
              <select
                value={govKey}
                onChange={(e) => {
                  setGovKey(e.target.value);
                  setAreaKey("");
                }}
                className="h-11 w-full rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground"
              >
                {governorates.map((g) => (
                  <option key={g.key} value={g.key}>
                    {locale === "ar" ? g.nameAr : g.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {governorate ? (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("area.picker.area")}
                </p>
                <select
                  value={areaKey}
                  onChange={(e) => setAreaKey(e.target.value)}
                  className="h-11 w-full rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground"
                >
                  <option value="" disabled>
                    {t("area.picker.area")}…
                  </option>
                  {governorate.areas.map((a) => (
                    <option key={a.key} value={a.key}>
                      {locale === "ar" ? a.nameAr : a.nameEn}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <Button
              type="button"
              className="w-full rounded-xl"
              disabled={saving || !areaKey}
              onClick={() => void onSelectArea(areaKey)}
            >
              {saving ? "…" : t("area.picker.deliverTo")}
            </Button>
            </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
