"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  setBranchStoreStatus,
  type BranchStoreStatus,
} from "@/actions/branch-status";
import { cn } from "@/lib/utils";

const OPTIONS: { value: BranchStoreStatus; label: string; cls: string }[] = [
  { value: "OPEN", label: "Open", cls: "border-emerald-500/50 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" },
  { value: "BUSY", label: "Busy", cls: "border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  { value: "CLOSED", label: "Closed", cls: "border-red-500/50 bg-red-500/15 text-red-600 dark:text-red-300" },
];

export function BranchStatusControl({
  branches,
}: {
  branches: { id: string; name: string; storeStatus: string }[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = React.useState<string | null>(null);

  async function change(id: string, status: BranchStoreStatus) {
    setBusyId(id);
    const res = await setBranchStoreStatus(id, status);
    if (res.ok) {
      toast.success("Branch status updated");
      router.refresh();
    } else {
      toast.error(res.error);
    }
    setBusyId(null);
  }

  if (branches.length === 0) return null;

  return (
    <div className="mt-6 space-y-2 rounded-2xl border border-border bg-card/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Branch status — controls whether customers can order
      </p>
      {branches.map((b) => (
        <div key={b.id} className="flex flex-wrap items-center gap-2">
          <span className="min-w-[200px] text-sm font-medium">{b.name}</span>
          <div className="flex gap-1.5">
            {OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                disabled={busyId === b.id}
                onClick={() => void change(b.id, o.value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold transition",
                  b.storeStatus === o.value
                    ? o.cls
                    : "border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
