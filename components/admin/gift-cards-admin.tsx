"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { TranslationKey } from "@/lib/dictionary";
import { formatKwd } from "@/lib/format";
import { issueGiftCard } from "@/actions/gift-cards";
import {
  createGiftCardProduct,
  deleteGiftCardProduct,
  deleteIssuedGiftCard,
  setGiftCardEnabled,
  updateGiftCardProduct,
  uploadGiftCardProductImage,
} from "@/actions/gift-card-products-admin";
import { adminDisableGiftCard, adminExpireGiftCard } from "@/actions/orders-admin";
import type { GiftCardProductAdminDTO } from "@/lib/gift-card-products";

export type AdminGiftCardRow = {
  id: string;
  code: string;
  initialValue: number;
  balance: number;
  status: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  redeemedBy: string;
  enabled: boolean;
  expiresAtIso: string | null;
  createdAtIso: string;
  txnCount: number;
  txns: Array<{
    id: string;
    type: string;
    amount: number;
    reason: string;
    createdAtIso: string;
  }>;
};

type Props = {
  catalog: GiftCardProductAdminDTO[];
  rows: AdminGiftCardRow[];
};

function CatalogRow({
  row,
}: {
  row: GiftCardProductAdminDTO;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [draft, setDraft] = React.useState(row);
  const [presetsText, setPresetsText] = React.useState(
    row.presetAmounts.join(", ")
  );
  const [file, setFile] = React.useState<File | null>(null);

  React.useEffect(() => {
    setDraft(row);
    setPresetsText(row.presetAmounts.join(", "));
  }, [row]);

  async function save() {
    setBusy(true);
    try {
      let image = draft.image;
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        image = await uploadGiftCardProductImage(fd);
      }
      const parsedPresets = presetsText
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n) && n > 0);
      await updateGiftCardProduct(row.id, {
        titleEn: draft.titleEn,
        titleAr: draft.titleAr,
        descriptionEn: draft.descriptionEn,
        descriptionAr: draft.descriptionAr,
        image,
        price: Number(draft.priceKwd),
        allowCustomAmount: draft.allowCustomAmount,
        presetAmounts: parsedPresets,
        minCustomAmount: draft.minCustomAmount,
        maxCustomAmount: draft.maxCustomAmount,
        enabled: draft.enabled,
        sortOrder: Number(draft.sortOrder),
      });
      toast.success(t("admin.products.toast.updated"));
      setFile(null);
      router.refresh();
    } catch {
      toast.error(t("admin.products.error.update"));
    }
    setBusy(false);
  }

  async function remove() {
    if (!window.confirm(t("admin.giftCards.catalog.delete") + "?")) return;
    setBusy(true);
    try {
      await deleteGiftCardProduct(row.id);
      toast.success(t("admin.products.toast.deleted"));
      router.refresh();
    } catch {
      toast.error(t("admin.products.error.delete"));
    }
    setBusy(false);
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card/50 p-4">
      <div className="flex gap-4">
        <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-lg bg-card">
          <Image
            src={draft.image}
            alt={draft.titleEn}
            fill
            className="object-cover"
            sizes="144px"
          />
        </div>
        <div className="grid flex-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <Label>{t("admin.giftCards.catalog.titleEn")}</Label>
            <Input
              value={draft.titleEn}
              onChange={(e) =>
                setDraft((d) => ({ ...d, titleEn: e.target.value }))
              }
              className="border-border bg-card"
            />
          </div>
          <div className="space-y-1">
            <Label>{t("admin.giftCards.catalog.titleAr")}</Label>
            <Input
              value={draft.titleAr}
              onChange={(e) =>
                setDraft((d) => ({ ...d, titleAr: e.target.value }))
              }
              className="border-border bg-card"
            />
          </div>
          <div className="space-y-1">
            <Label>{t("admin.giftCards.catalog.price")}</Label>
            <Input
              type="number"
              step="0.001"
              value={draft.priceKwd}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  priceKwd: Number(e.target.value),
                }))
              }
              className="border-border bg-card"
            />
          </div>
          <div className="space-y-1">
            <Label>{t("admin.giftCards.catalog.sortOrder")}</Label>
            <Input
              type="number"
              value={draft.sortOrder}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  sortOrder: Number(e.target.value),
                }))
              }
              className="border-border bg-card"
            />
          </div>
          <div className="space-y-1 md:col-span-2 lg:col-span-3">
            <Label>{t("admin.giftCards.catalog.presetAmounts")}</Label>
            <Input
              value={presetsText}
              onChange={(e) => setPresetsText(e.target.value)}
              placeholder="10, 25, 50"
              className="border-border bg-card"
            />
            <p className="text-xs text-muted-foreground">
              {t("admin.giftCards.catalog.presetAmountsHint")}
            </p>
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>{t("admin.giftCards.catalog.imageUrl")}</Label>
            <Input
              value={draft.image}
              onChange={(e) =>
                setDraft((d) => ({ ...d, image: e.target.value }))
              }
              className="border-border bg-card"
            />
          </div>
          <div className="space-y-1">
            <Label>{t("admin.products.label.upload")}</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="border-border bg-card"
            />
          </div>
          <div className="space-y-1 md:col-span-2 lg:col-span-3">
            <Label>{t("admin.giftCards.catalog.descriptionEn")}</Label>
            <Textarea
              rows={2}
              value={draft.descriptionEn}
              onChange={(e) =>
                setDraft((d) => ({ ...d, descriptionEn: e.target.value }))
              }
              className="border-border bg-card"
            />
          </div>
          <div className="space-y-1 md:col-span-2 lg:col-span-3">
            <Label>{t("admin.giftCards.catalog.descriptionAr")}</Label>
            <Textarea
              rows={2}
              value={draft.descriptionAr}
              onChange={(e) =>
                setDraft((d) => ({ ...d, descriptionAr: e.target.value }))
              }
              className="border-border bg-card"
            />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={draft.enabled}
              onCheckedChange={(v) =>
                setDraft((d) => ({ ...d, enabled: Boolean(v) }))
              }
            />
            {t("admin.giftCards.catalog.enabled")}
          </label>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={remove}>
            {t("admin.giftCards.catalog.delete")}
          </Button>
          <Button type="button" disabled={busy} onClick={save}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            {t("admin.banners.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function GiftCardsAdmin({ catalog, rows }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const [tab, setTab] = React.useState<"catalog" | "issued">("catalog");

  const [titleEn, setTitleEn] = React.useState("");
  const [titleAr, setTitleAr] = React.useState("");
  const [descriptionEn, setDescriptionEn] = React.useState("");
  const [descriptionAr, setDescriptionAr] = React.useState("");
  const [price, setPrice] = React.useState("25");
  const [presetAmounts, setPresetAmounts] = React.useState("10,25,50");
  const [allowCustomAmount] = React.useState(false);
  const [sortOrder, setSortOrder] = React.useState("0");
  const [imageUrl, setImageUrl] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [enabled, setEnabled] = React.useState(true);
  const [createBusy, setCreateBusy] = React.useState(false);
  const [showCreate, setShowCreate] = React.useState(false);

  const [issueAmount, setIssueAmount] = React.useState("20");
  const [issueEmail, setIssueEmail] = React.useState("");
  const [issuePending, setIssuePending] = React.useState(false);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!titleEn.trim()) {
      toast.error(t("admin.giftCards.catalog.titleRequired"));
      return;
    }
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0.5 || priceNum > 500) {
      toast.error(t("admin.giftCards.catalog.priceRange"));
      return;
    }
    setCreateBusy(true);
    try {
      let image = imageUrl.trim();
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        image = await uploadGiftCardProductImage(fd);
      }
      if (!image) {
        toast.error(t("admin.products.error.noImage"));
        setCreateBusy(false);
        return;
      }
      await createGiftCardProduct({
        titleEn: titleEn.trim(),
        titleAr: titleAr.trim(),
        descriptionEn: descriptionEn.trim(),
        descriptionAr: descriptionAr.trim(),
        image,
        price: Number(price),
        allowCustomAmount,
        presetAmounts: presetAmounts
          .split(",")
          .map((s) => Number(s.trim()))
          .filter((n) => Number.isFinite(n) && n > 0),
        minCustomAmount: 1,
        maxCustomAmount: 500,
        enabled,
        sortOrder: Number(sortOrder),
      });
      toast.success(t("admin.giftCards.catalog.created"));
      setTitleEn("");
      setTitleAr("");
      setDescriptionEn("");
      setDescriptionAr("");
      setPrice("20");
      setSortOrder("0");
      setImageUrl("");
      setFile(null);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : t("admin.products.error.create")
      );
    }
    setCreateBusy(false);
  }

  async function onIssue(e: React.FormEvent) {
    e.preventDefault();
    setIssuePending(true);
    const res = await issueGiftCard({
      amount: Number(issueAmount),
      recipientEmail: issueEmail.trim() || undefined,
    });
    setIssuePending(false);
    if (res.ok) {
      toast.success(`Issued ${res.code} for ${formatKwd(res.balance)}`);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  async function expireIssued(id: string) {
    if (!window.confirm(t("admin.giftCards.expireConfirm"))) return;
    try {
      await adminExpireGiftCard(id);
      toast.success(t("admin.giftCards.expired"));
      router.refresh();
    } catch {
      toast.error(t("admin.products.error.update"));
    }
  }

  async function disableIssued(id: string) {
    try {
      await adminDisableGiftCard(id);
      toast.success(t("admin.giftCards.disabled"));
      router.refresh();
    } catch {
      toast.error(t("admin.products.error.update"));
    }
  }

  function statusLabel(status: string) {
    return t(
      `admin.giftCards.status.${status.toLowerCase()}` as TranslationKey
    );
  }

  async function toggleIssued(id: string, next: boolean) {
    try {
      await setGiftCardEnabled(id, next);
      router.refresh();
    } catch {
      toast.error(t("admin.products.error.update"));
    }
  }

  async function removeIssued(id: string) {
    if (!window.confirm(t("admin.giftCards.deleteIssued") + "?")) return;
    try {
      await deleteIssuedGiftCard(id);
      toast.success(t("admin.products.toast.deleted"));
      router.refresh();
    } catch {
      toast.error(t("admin.products.error.delete"));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={tab === "catalog" ? "default" : "outline"}
          onClick={() => setTab("catalog")}
        >
          {t("admin.giftCards.tab.catalog")}
        </Button>
        <Button
          type="button"
          variant={tab === "issued" ? "default" : "outline"}
          onClick={() => setTab("issued")}
        >
          {t("admin.giftCards.tab.issued")}
        </Button>
      </div>

      {tab === "catalog" ? (
        <>
          <Button
            type="button"
            className="rounded-xl"
            onClick={() => setShowCreate((v) => !v)}
          >
            {showCreate
              ? t("admin.giftCards.catalog.close")
              : `+ ${t("admin.giftCards.catalog.create")}`}
          </Button>
          {showCreate ? (
          <form
            onSubmit={onCreate}
            className="space-y-4 rounded-2xl border border-border bg-card/40 p-4"
          >
            <p className="text-sm font-medium text-foreground">
              {t("admin.giftCards.catalog.create")}
            </p>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <Label>{t("admin.giftCards.catalog.titleEn")}</Label>
                <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t("admin.giftCards.catalog.titleAr")}</Label>
                <Input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t("admin.giftCards.catalog.price")}</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>{t("admin.giftCards.catalog.sortOrder")}</Label>
                <Input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>{t("admin.giftCards.catalog.imageUrl")}</Label>
                <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t("admin.products.label.upload")}</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="space-y-1 md:col-span-2 lg:col-span-3">
                <Label>{t("admin.giftCards.catalog.descriptionEn")}</Label>
                <Textarea
                  rows={2}
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                />
              </div>
              <div className="space-y-1 md:col-span-2 lg:col-span-3">
                <Label>{t("admin.giftCards.catalog.descriptionAr")}</Label>
                <Textarea
                  rows={2}
                  value={descriptionAr}
                  onChange={(e) => setDescriptionAr(e.target.value)}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={enabled}
                onCheckedChange={(v) => setEnabled(Boolean(v))}
              />
              {t("admin.giftCards.catalog.enabled")}
            </label>
            <Button type="submit" disabled={createBusy}>
              {createBusy ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("admin.giftCards.catalog.createBtn")}
            </Button>
          </form>
          ) : null}

          <div className="space-y-3">
            {catalog.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("admin.giftCards.catalog.empty")}
              </p>
            ) : (
              catalog.map((row) => <CatalogRow key={row.id} row={row} />)
            )}
          </div>
        </>
      ) : (
        <>
          <form
            onSubmit={onIssue}
            className="grid items-end gap-3 rounded-2xl border border-border bg-card/40 p-4 sm:grid-cols-[120px_1fr_auto]"
          >
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                {t("admin.giftCards.amount")}
              </label>
              <Input
                inputMode="decimal"
                value={issueAmount}
                onChange={(e) => setIssueAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                {t("admin.giftCards.recipientEmail")}
              </label>
              <Input
                type="email"
                value={issueEmail}
                onChange={(e) => setIssueEmail(e.target.value)}
                placeholder="optional@example.com"
              />
            </div>
            <Button type="submit" disabled={issuePending}>
              {issuePending ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("admin.giftCards.issue")}
            </Button>
          </form>

          <div className="overflow-x-auto rounded-2xl border border-border bg-card/40">
            <table className="w-full min-w-[1100px] text-start text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start">{t("admin.giftCards.code")}</th>
                  <th className="px-4 py-3 text-start">{t("admin.giftCards.recipient")}</th>
                  <th className="px-4 py-3 text-start">{t("admin.giftCards.balance")}</th>
                  <th className="px-4 py-3 text-start">{t("admin.giftCards.status")}</th>
                  <th className="px-4 py-3 text-start">{t("admin.giftCards.expires")}</th>
                  <th className="px-4 py-3 text-start">{t("admin.giftCards.history")}</th>
                  <th className="px-4 py-3 text-start">{t("admin.giftCards.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      —
                    </td>
                  </tr>
                ) : (
                  rows.map((c) => (
                    <tr key={c.id} className="border-b border-border align-top">
                      <td className="px-4 py-3 font-mono text-xs text-foreground">
                        {c.code}
                        <p className="mt-1 text-muted-foreground">
                          {formatKwd(c.initialValue)} ·{" "}
                          {new Date(c.createdAtIso).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <p>{c.recipientName}</p>
                        <p className="text-xs">{c.recipientEmail}</p>
                        <p className="text-xs">{c.recipientPhone}</p>
                        {c.redeemedBy !== "—" ? (
                          <p className="mt-1 text-xs text-primary">
                            {t("admin.giftCards.redeemedBy")}: {c.redeemedBy}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-primary">
                        {formatKwd(c.balance)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {statusLabel(c.status)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {c.expiresAtIso
                          ? new Date(c.expiresAtIso).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {c.txns.slice(0, 3).map((txn) => (
                          <p key={txn.id}>
                            {txn.type} · {formatKwd(txn.amount)}
                          </p>
                        ))}
                        {c.txnCount > 3 ? (
                          <p>+{c.txnCount - 3} more</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {c.status !== "EXPIRED" && c.status !== "REDEEMED" ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => disableIssued(c.id)}
                            >
                              {t("admin.giftCards.disable")}
                            </Button>
                          ) : null}
                          {c.status === "ACTIVE" || c.status === "PARTIALLY_USED" ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => expireIssued(c.id)}
                            >
                              {t("admin.giftCards.expire")}
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => removeIssued(c.id)}
                          >
                            {t("admin.giftCards.deleteIssued")}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
