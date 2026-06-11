"use client";

import * as React from "react";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { saveBranchDeliveryAreas } from "@/actions/branch-delivery-areas";
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
  /** Branch admins view the areas the super admin set but cannot edit them. */
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
}: {
  governorate: KuwaitGovernorate;
  state: Record<string, { enabled: boolean; fee: string }>;
  setState: React.Dispatch<
    React.SetStateAction<Record<string, { enabled: boolean; fee: string }>>
  >;
  readOnly?: boolean;
}) {
  const [open, setOpen] = React.useState(false);

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
          {governorate.areas.map((a) => {
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
  readOnly = false,
}: Props) {
  const [state, setState] = React.useState(() => buildInitialState(initialRows));
  const [saving, setSaving] = React.useState(false);

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
      {readOnly ? (
        <p className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          These delivery areas are set by the super admin. You can view the
          areas and fees for your branch but cannot change them.
        </p>
      ) : null}
      {KUWAIT_GOVERNORATES.map((g) => (
        <GovernorateSection
          key={g.key}
          governorate={g}
          state={state}
          setState={setState}
          readOnly={readOnly}
        />
      ))}
      {!readOnly ? (
        <Button
          type="button"
          onClick={() => void onSave()}
          disabled={saving}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {saving ? "Saving…" : "Save delivery areas"}
        </Button>
      ) : null}
    </div>
  );
}
