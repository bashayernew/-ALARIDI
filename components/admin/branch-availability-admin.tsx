"use client";

import * as React from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { setBranchAvailability } from "@/actions/branch-availability";

type Line = {
  id: string;
  sectionSlug: string;
  sectionLabel: string;
  name: string;
  basePrice: number;
};

type AvailEntry = { available: boolean; priceOverride: number | null };

type Props = {
  branchId: string;
  lines: Line[];
  availabilityMap: Record<string, AvailEntry>;
};

export function BranchAvailabilityAdmin({
  branchId,
  lines,
  availabilityMap,
}: Props) {
  const [state, setState] = React.useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const l of lines) {
      init[l.id] = availabilityMap[l.id]?.available ?? true;
    }
    return init;
  });
  const [, setSavingId] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");

  async function persist(lineId: string, available: boolean) {
    setSavingId(lineId);
    try {
      await setBranchAvailability({
        branchId,
        productId: lineId,
        available,
        // Price is managed on the Products page; preserve any existing
        // branch override here without exposing it for editing.
        priceOverride: availabilityMap[lineId]?.priceOverride ?? null,
      });
      toast.success(available ? "Now showing in store" : "Hidden from store");
    } catch {
      toast.error("Could not save");
    }
    setSavingId(null);
  }

  function toggle(lineId: string, available: boolean) {
    setState((s) => ({ ...s, [lineId]: available }));
    void persist(lineId, available);
  }

  const shownCount = lines.filter((l) => state[l.id]).length;

  const term = query.trim().toLowerCase();
  const visibleLines = term
    ? lines.filter((l) => l.name.toLowerCase().includes(term))
    : lines;

  // Group lines by section, preserving incoming order.
  const groups: { label: string; items: Line[] }[] = [];
  for (const l of visibleLines) {
    const last = groups[groups.length - 1];
    if (last && last.label === l.sectionLabel) last.items.push(l);
    else groups.push({ label: l.sectionLabel, items: [l] });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-primary">{shownCount}</span> of{" "}
          {lines.length} menu items showing in the store. Tick an item to show
          it, untick to hide it — saved instantly.
        </p>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the menu…"
            className="h-9 w-56 ps-8"
          />
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="rounded-xl border border-border bg-card/40 px-4 py-6 text-center text-sm text-muted-foreground">
          No menu items match “{query}”.
        </p>
      ) : (
        groups.map((g) => (
          <section key={g.label}>
            <h2 className="mb-3 font-heading text-xl text-foreground">
              {g.label}
            </h2>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              {g.items.map((l) => {
                const available = state[l.id]!;
                return (
                  <div
                    key={l.id}
                    className="flex flex-wrap items-center gap-4 border-b border-border px-4 py-3 last:border-b-0"
                  >
                    <label className="flex w-28 shrink-0 cursor-pointer items-center gap-2">
                      <Checkbox
                        checked={available}
                        onCheckedChange={(v) => toggle(l.id, v === true)}
                      />
                      <span
                        className={
                          available
                            ? "text-xs font-medium text-primary"
                            : "text-xs font-medium text-muted-foreground"
                        }
                      >
                        {available ? "In store" : "Hidden"}
                      </span>
                    </label>
                    <div className="min-w-0 flex-1">
                      <p
                        className={
                          available
                            ? "truncate font-medium text-foreground"
                            : "truncate font-medium text-muted-foreground line-through"
                        }
                      >
                        {l.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Price: KWD {l.basePrice.toFixed(3)}
                        {!available ? " · Hidden from store" : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
