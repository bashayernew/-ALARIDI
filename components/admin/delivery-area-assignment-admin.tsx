"use client";

import * as React from "react";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { saveDeliveryAreaAssignments } from "@/actions/branch-delivery-areas";
import {
  KUWAIT_GOVERNORATES,
  type KuwaitGovernorate,
} from "@/lib/kuwait-areas";
import { cn } from "@/lib/utils";

export type BranchOption = { id: string; name: string };

/** Current assignment per `${governorate}:${area}` key. */
export type AreaAssignment = { branchId: string | null; fee: number };

type Props = {
  branches: BranchOption[];
  initialAssignments: Record<string, AreaAssignment>;
};

type CellState = { branchId: string; fee: string };

const NO_DELIVERY = "";

function buildInitialState(
  initial: Record<string, AreaAssignment>
): Record<string, CellState> {
  const map: Record<string, CellState> = {};
  for (const g of KUWAIT_GOVERNORATES) {
    for (const a of g.areas) {
      const key = `${g.key}:${a.key}`;
      const hit = initial[key];
      map[key] = {
        branchId: hit?.branchId ?? NO_DELIVERY,
        fee: hit ? String(hit.fee) : "0",
      };
    }
  }
  return map;
}

function GovernorateSection({
  governorate,
  branches,
  state,
  setState,
}: {
  governorate: KuwaitGovernorate;
  branches: BranchOption[];
  state: Record<string, CellState>;
  setState: React.Dispatch<
    React.SetStateAction<Record<string, CellState>>
  >;
}) {
  const [open, setOpen] = React.useState(false);

  const assignedCount = governorate.areas.filter(
    (a) => (state[`${governorate.key}:${a.key}`]?.branchId ?? "") !== ""
  ).length;

  return (
    <section className="rounded-xl border border-border bg-card/30">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-start"
      >
        <span className="font-heading text-lg text-foreground">
          {governorate.nameEn}
          <span className="ms-2 text-xs font-normal text-muted-foreground">
            {assignedCount}/{governorate.areas.length} delivered
          </span>
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
            const cell = state[key] ?? { branchId: NO_DELIVERY, fee: "0" };
            const hasBranch = cell.branchId !== NO_DELIVERY;
            return (
              <li
                key={key}
                className="flex flex-wrap items-center gap-3 px-4 py-2.5 sm:flex-nowrap"
              >
                <span className="min-w-[140px] flex-1 text-sm text-foreground">
                  {a.nameEn}
                </span>
                <select
                  value={cell.branchId}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      [key]: { ...s[key]!, branchId: e.target.value },
                    }))
                  }
                  className="h-8 w-[220px] rounded-md border border-border bg-background px-2 text-sm text-foreground"
                  aria-label={`Delivering branch for ${a.nameEn}`}
                >
                  <option value={NO_DELIVERY}>— No delivery —</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">KWD</span>
                  <Input
                    type="number"
                    min={0}
                    step={0.25}
                    value={cell.fee}
                    disabled={!hasBranch}
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

export function DeliveryAreaAssignmentAdmin({
  branches,
  initialAssignments,
}: Props) {
  const [state, setState] = React.useState(() =>
    buildInitialState(initialAssignments)
  );
  const [saving, setSaving] = React.useState(false);

  async function onSave() {
    setSaving(true);
    try {
      const rows = KUWAIT_GOVERNORATES.flatMap((g) =>
        g.areas.map((a) => {
          const key = `${g.key}:${a.key}`;
          const cell = state[key]!;
          const fee = Number(cell.fee);
          return {
            governorate: g.key,
            area: a.key,
            branchId: cell.branchId === NO_DELIVERY ? null : cell.branchId,
            deliveryFeeKwd: Number.isFinite(fee) ? fee : 0,
          };
        })
      );
      await saveDeliveryAreaAssignments({ rows });
      toast.success("Delivery area assignments saved");
    } catch {
      toast.error("Could not save assignments");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
        Assign a single branch to each area. The chosen branch handles those
        orders and its menu (including any products it hides) is what customers
        in that area see. Areas left as <strong>No delivery</strong> are
        pickup-only.
      </p>
      {KUWAIT_GOVERNORATES.map((g) => (
        <GovernorateSection
          key={g.key}
          governorate={g}
          branches={branches}
          state={state}
          setState={setState}
        />
      ))}
      <Button
        type="button"
        onClick={() => void onSave()}
        disabled={saving}
        className="bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {saving ? "Saving…" : "Save delivery areas"}
      </Button>
    </div>
  );
}
