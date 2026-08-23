"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/components/i18n/i18n-provider";
import {
  updateBranchHours,
  updateBranchWhatsapp,
  type BranchWhatsappRow,
} from "@/actions/branch-whatsapp-admin";
  
function BranchRow({ row }: { row: BranchWhatsappRow }) {
  const { t } = useI18n();
  const router = useRouter();
  const [num, setNum] = React.useState(row.whatsappNumber);
  const [openTime, setOpenTime] = React.useState(row.openTime);
  const [closeTime, setCloseTime] = React.useState(row.closeTime);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    setNum(row.whatsappNumber);
    setOpenTime(row.openTime);
    setCloseTime(row.closeTime);
  }, [row]);

  async function save() {
    setBusy(true);
    try {
      const res = await updateBranchWhatsapp(row.id, num);
      const hoursRes = await updateBranchHours(row.id, openTime, closeTime);
      if (res.ok && hoursRes.ok) {
        setNum(res.number);
        toast.success(t("admin.branchWhatsapp.saved"));
        router.refresh();
      } else {
        toast.error((!res.ok && res.error) || (!hoursRes.ok && hoursRes.error) || "Error");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border/60 bg-card/40 p-4">
      <div className="min-w-[160px] flex-1">
        <Label className="text-xs text-muted-foreground">
          {t("admin.branchWhatsapp.branch")}
        </Label>
        <p className="font-medium text-foreground">{row.name}</p>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{t("admin.branchWhatsapp.number")}</Label>
        <Input
          value={num}
          onChange={(e) => setNum(e.target.value)}
          placeholder="9655xxxxxxx"
          inputMode="numeric"
          dir="ltr"
          className="w-56"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Opens</Label>
        <Input
          type="time"
          value={openTime}
          onChange={(e) => setOpenTime(e.target.value)}
          className="w-32"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Closes</Label>
        <Input
          type="time"
          value={closeTime}
          onChange={(e) => setCloseTime(e.target.value)}
          className="w-32"
        />
      </div>
      <Button type="button" disabled={busy} onClick={save}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : t("admin.banners.save")}
      </Button>
    </div>
  );
}

export function BranchWhatsappAdmin({
  branches,
}: {
  branches: BranchWhatsappRow[];
}) {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-heading text-3xl">{t("admin.branchWhatsapp.title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("admin.branchWhatsapp.subtitle")}
      </p>
      <div className="mt-8 space-y-3">
        {branches.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("admin.branchWhatsapp.empty")}
          </p>
        ) : (
          branches.map((b) => <BranchRow key={b.id} row={b} />)
        )}
      </div>
    </div>
  );
}
