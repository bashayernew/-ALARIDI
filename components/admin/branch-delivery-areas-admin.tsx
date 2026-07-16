"use client";

import * as React from "react";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  saveBranchDeliveryAreas,
  updateOwnBranchDeliveryAreas,
} from "@/actions/branch-delivery-areas";
import {
  KUWAIT_GOVERNORATES,
  type KuwaitGovernorate,
} from "@/lib/kuwait-areas";
import { cn } from "@/lib/utils";

export type DeliveryAreaFormRow = {
  governorate: string;
  area: string;
  areaNameEn: string;
  enabled: boolean;
  deliveryFeeKwd: number;
};

type Props = {
  branchId: string;
  initialRows: DeliveryAreaFormRow[];
  /**
   * Branch-admin mode: show ONLY the areas assigned to this branch and let
   * the admin edit the fee and toggle delivery for each of them.
   */
  ownAreasOnly?: boolean;
  /** Legacy read-only view. */
  readOnly?: boolean;
};

function buildInitialState(rows: DeliveryAreaFormRow[]) {
  const map: Record<string, { enabled: boolean; fee: string }> = {};
  for (const g of KUWAIT_GOVERNORATES) {
    for (const a of g.areas) {
      const key = `${g.key}:${a.key}`;
      const hit = rows.find(
        (r) => r.governorate === g.key && r.area === a.key
      );
      map[key] = {
        enabled: hit?.enabled ?? false,
        fee: hit != null ? String(hit.deliveryFeeKwd) : "0",
      };
    }
  }
  return map;
}

function GovernorateSection({
  governorate,
  state,
  setState,
  readOnly = false,
  visibleAreas,
  defaultOpen = false,
}: {
  governorate: KuwaitGovernorate;
  state: Record<string, { enabled: boolean; fee: string }>;
  setState: React.Dispatch<
    React.SetStateAction<Record<string, { enabled: boolean; fee: string }>>
  >;
  readOnly?: boolean;
  /** When provided, only these area keys are rendered. */
  visibleAreas?: Set<string>;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const areas = visibleAreas
    ? governorate.areas.filter((a) => visibleAreas.has(a.key))
    : governorate.areas;

  return (
    <section className="rounded-xl border border-border bg-card/30">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-start"
      >
        <span className="font-heading text-lg text-foreground">
          {governorate.nameEn}
        </span>
        <ChevronDown
          className={cn(
            "size-5 text-muted-foreground transition",
            open && "rotate-180"
          )}
        />
      </button>
      {open ? (
        <ul className="divide-y divide-border border-t border-border">
          {areas.map((a) => {
            const key = `${governorate.key}:${a.key}`;
            const row = state[key] ?? { enabled: false, fee: "0" };
            return (
              <li
                key={key}
                className="flex flex-wrap items-center gap-3 px-4 py-2.5 sm:flex-nowrap"
              >
                <label className="flex min-w-[180px] flex-1 items-center gap-2 text-sm text-foreground">
                  <Checkbox
                    checked={row.enabled}
                    disabled={readOnly}
                    onCheckedChange={(v) =>
                      setState((s) => ({
                        ...s,
                        [key]: { ...s[key]!, enabled: v === true },
                      }))
                    }
                  />
                  {a.nameEn}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">KWD</span>
                  <Input
                    type="number"
                    min={0}
                    step={0.25}
                    value={row.fee}
                    disabled={readOnly || !row.enabled}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        [key]: { ...s[key]!, fee: e.target.value },
                      }))
                    }
                    className="h-8 w-24 border-border bg-background"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

export function BranchDeliveryAreasAdmin({
  branchId,
  initialRows,
  ownAreasOnly = false,
  readOnly = false,
}: Props) {
  const [state, setState] = React.useState(() => buildInitialState(initialRows));
  const [saving, setSaving] = React.useState(false);

  const assignedAreas = React.useMemo(
    () => new Set(initialRows.map((r) => r.area)),
    [initialRows]
  );
  const visibleGovernorates = ownAreasOnly
    ? KUWAIT_GOVERNORATES.filter((g) =>
        g.areas.some((a) => assignedAreas.has(a.key))
      )
    : KUWAIT_GOVERNORATES;

  async function onSaveOwn() {
    setSaving(true);
    try {
      const rows = initialRows.map((r) => {
        const row = state[`${r.governorate}:${r.area}`]!;
        const fee = Number(row.fee);
        return {
          area: r.area,
          enabled: row.enabled,
          deliveryFeeKwd: Number.isFinite(fee) ? fee : 0,
        };
      });
      await updateOwnBranchDeliveryAreas({ rows });
      toast.success("Delivery areas saved");
    } catch {
      toast.error("Could not save");
    }
    setSaving(false);
  }

  async function onSave() {
    setSaving(true);
    try {
      const rows: {
        governorate: string;
        area: string;
        enabled: boolean;
        deliveryFeeKwd: number;
      }[] = [];
      for (const g of KUWAIT_GOVERNORATES) {
        for (const a of g.areas) {
          const key = `${g.key}:${a.key}`;
          const row = state[key]!;
          const fee = Number(row.fee);
          rows.push({
            governorate: g.key,
            area: a.key,
            enabled: row.enabled,
            deliveryFeeKwd: Number.isFinite(fee) ? fee : 0,
          });
        }
      }
      await saveBranchDeliveryAreas({ branchId, rows });
      toast.success("Delivery areas saved");
    } catch {
      toast.error("Could not save");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      {ownAreasOnly ? (
        <p className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          These are the areas assigned to your branch by the super admin. You
          can set the delivery fee and turn delivery on or off for each area.
        </p>
      ) : readOnly ? (
        <p className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          These delivery areas are set by the super admin. You can view the
          areas and fees for your branch but cannot change them.
        </p>
      ) : null}
      {ownAreasOnly && visibleGovernorates.length === 0 ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          No delivery areas have been assigned to your branch yet. Ask the
          super admin to assign areas.
        </p>
      ) : null}
      {visibleGovernorates.map((g) => (
        <GovernorateSection
          key={g.key}
          governorate={g}
          state={state}
          setState={setState}
          readOnly={readOnly}
          visibleAreas={ownAreasOnly ? assignedAreas : undefined}
          defaultOpen={ownAreasOnly}
        />
      ))}
      {!readOnly ? (
        <Button
          type="button"
          onClick={() => void (ownAreasOnly ? onSaveOwn() : onSave())}
          disabled={saving}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {saving ? "Saving…" : "Save delivery areas"}
        </Button>
      ) : null}
    </div>
  );
}
