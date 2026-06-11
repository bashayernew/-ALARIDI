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
import { cn } from "@/lib/utils";

export type ServedArea = { governorateKey: string; areaKey: string };

type Props = {
  selected: SelectedKuwaitArea | null;
  areaLabel: string | null;
  /** Areas at least one branch delivers to. Empty = show the full list. */
  servedAreas?: ServedArea[];
  /** Open picker on mount when no area is saved. */
  promptOnMount?: boolean;
  className?: string;
};

export function StorefrontAreaPicker({
  selected,
  areaLabel,
  servedAreas = [],
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

  React.useEffect(() => {
    if (promptOnMount && !selected) setOpen(true);
  }, [promptOnMount, selected]);

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
          "max-w-[200px] gap-1.5 truncate px-2 text-muted-foreground hover:text-foreground sm:max-w-[240px]",
          className
        )}
        onClick={() => setOpen(true)}
        aria-label={t("area.picker.choose")}
      >
        <MapPin className="size-4 shrink-0 text-primary" />
        <span className="truncate text-xs sm:text-sm">
          {selected ? (
            <>
              <span className="text-muted-foreground">
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
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("area.picker.governorate")}
              </p>
              <div className="flex flex-wrap gap-2">
                {governorates.map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => setGovKey(g.key)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-sm transition",
                      govKey === g.key
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    {locale === "ar" ? g.nameAr : g.nameEn}
                  </button>
                ))}
              </div>
            </div>

            {governorate ? (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("area.picker.area")}
                </p>
                <ul className="grid gap-1 sm:grid-cols-2">
                  {governorate.areas.map((a) => (
                    <li key={a.key}>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void onSelectArea(a.key)}
                        className={cn(
                          "w-full rounded-lg border px-3 py-2 text-start text-sm transition hover:border-primary/50 hover:bg-muted/50",
                          selected?.governorateKey === govKey &&
                            selected?.areaKey === a.key &&
                            "border-primary bg-primary/5"
                        )}
                      >
                        {locale === "ar" ? a.nameAr : a.nameEn}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
