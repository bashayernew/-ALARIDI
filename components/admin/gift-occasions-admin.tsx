"use client";

import * as React from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { GiftOccasionAdminDTO } from "@/lib/gift-occasions";
import {
  createGiftOccasion,
  deleteGiftOccasion,
  setGiftOccasionEnabled,
  updateGiftOccasion,
  type GiftOccasionForm,
} from "@/actions/gift-occasions-admin";

type BasketOption = { id: string; nameEn: string; visibility: string };
type CardOption = { id: string; titleEn: string; enabled: boolean };

type Props = {
  occasions: GiftOccasionAdminDTO[];
  baskets: BasketOption[];
  giftCards: CardOption[];
};

function emptyForm(): GiftOccasionForm {
  return {
    nameEn: "",
    nameAr: "",
    enabled: true,
    sortOrder: 0,
    giftBasketIds: [],
    giftCardProductIds: [],
  };
}

function rowToForm(row: GiftOccasionAdminDTO): GiftOccasionForm {
  return {
    nameEn: row.nameEn,
    nameAr: row.nameAr,
    enabled: row.enabled,
    sortOrder: row.sortOrder,
    giftBasketIds: [...row.giftBasketIds],
    giftCardProductIds: [...row.giftCardProductIds],
  };
}

function AssignmentPickers({
  draft,
  setDraft,
  baskets,
  giftCards,
}: {
  draft: GiftOccasionForm;
  setDraft: React.Dispatch<React.SetStateAction<GiftOccasionForm>>;
  baskets: BasketOption[];
  giftCards: CardOption[];
}) {
  const { t } = useI18n();

  function toggleBasket(id: string) {
    setDraft((d) => ({
      ...d,
      giftBasketIds: d.giftBasketIds.includes(id)
        ? d.giftBasketIds.filter((x) => x !== id)
        : [...d.giftBasketIds, id],
    }));
  }

  function toggleCard(id: string) {
    setDraft((d) => ({
      ...d,
      giftCardProductIds: d.giftCardProductIds.includes(id)
        ? d.giftCardProductIds.filter((x) => x !== id)
        : [...d.giftCardProductIds, id],
    }));
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2 rounded-xl border border-border bg-card/30 p-3">
        <Label>{t("admin.occasions.giftBaskets")}</Label>
        <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
          {baskets.length === 0 ? (
            <li className="text-muted-foreground">{t("admin.occasions.noBaskets")}</li>
          ) : (
            baskets.map((b) => (
              <li key={b.id} className="flex items-start gap-2">
                <Checkbox
                  id={`basket-${b.id}`}
                  checked={draft.giftBasketIds.includes(b.id)}
                  onCheckedChange={() => toggleBasket(b.id)}
                />
                <label htmlFor={`basket-${b.id}`} className="leading-snug text-foreground">
                  {b.nameEn}
                  {b.visibility !== "PUBLISHED" ? (
                    <span className="ms-1 text-xs text-muted-foreground">
                      ({b.visibility.toLowerCase()})
                    </span>
                  ) : null}
                </label>
              </li>
            ))
          )}
        </ul>
      </div>
      <div className="space-y-2 rounded-xl border border-border bg-card/30 p-3">
        <Label>{t("admin.occasions.giftCards")}</Label>
        <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
          {giftCards.length === 0 ? (
            <li className="text-muted-foreground">{t("admin.occasions.noGiftCards")}</li>
          ) : (
            giftCards.map((c) => (
              <li key={c.id} className="flex items-start gap-2">
                <Checkbox
                  id={`card-${c.id}`}
                  checked={draft.giftCardProductIds.includes(c.id)}
                  onCheckedChange={() => toggleCard(c.id)}
                />
                <label htmlFor={`card-${c.id}`} className="leading-snug text-foreground">
                  {c.titleEn}
                  {!c.enabled ? (
                    <span className="ms-1 text-xs text-muted-foreground">(disabled)</span>
                  ) : null}
                </label>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

function OccasionFields({
  draft,
  setDraft,
  baskets,
  giftCards,
}: {
  draft: GiftOccasionForm;
  setDraft: React.Dispatch<React.SetStateAction<GiftOccasionForm>>;
  baskets: BasketOption[];
  giftCards: CardOption[];
}) {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>{t("admin.occasions.nameEn")}</Label>
          <Input
            value={draft.nameEn}
            onChange={(e) => setDraft((d) => ({ ...d, nameEn: e.target.value }))}
            className="border-border bg-card"
          />
        </div>
        <div>
          <Label>{t("admin.occasions.nameAr")}</Label>
          <Input
            value={draft.nameAr}
            onChange={(e) => setDraft((d) => ({ ...d, nameAr: e.target.value }))}
            className="border-border bg-card"
            dir="rtl"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>{t("admin.occasions.sortOrder")}</Label>
          <Input
            type="number"
            value={draft.sortOrder}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                sortOrder: Number(e.target.value) || 0,
              }))
            }
            className="border-border bg-card"
          />
        </div>
        <label className="flex items-center gap-2 pt-8 text-sm text-foreground">
          <Checkbox
            checked={draft.enabled}
            onCheckedChange={(v) =>
              setDraft((d) => ({ ...d, enabled: v === true }))
            }
          />
          {t("admin.occasions.enabled")}
        </label>
      </div>
      <AssignmentPickers
        draft={draft}
        setDraft={setDraft}
        baskets={baskets}
        giftCards={giftCards}
      />
    </div>
  );
}

function OccasionRow({
  row,
  baskets,
  giftCards,
}: {
  row: GiftOccasionAdminDTO;
  baskets: BasketOption[];
  giftCards: CardOption[];
}) {
  const { t } = useI18n();
  const [editing, setEditing] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [draft, setDraft] = React.useState<GiftOccasionForm>(() => rowToForm(row));

  React.useEffect(() => {
    setDraft(rowToForm(row));
  }, [row]);

  async function save() {
    setBusy(true);
    try {
      await updateGiftOccasion(row.id, draft);
      toast.success(t("admin.occasions.saved"));
      setEditing(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("admin.products.error.update"));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(t("admin.occasions.confirmDelete"))) return;
    setBusy(true);
    try {
      await deleteGiftOccasion(row.id);
      toast.success(t("admin.occasions.deleted"));
    } catch {
      toast.error(t("admin.products.error.delete"));
    } finally {
      setBusy(false);
    }
  }

  async function toggleEnabled() {
    setBusy(true);
    try {
      await setGiftOccasionEnabled(row.id, !row.enabled);
      toast.success(t("admin.occasions.saved"));
    } catch {
      toast.error(t("admin.products.error.update"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="rounded-2xl border border-border bg-card/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-xl text-foreground">{row.nameEn}</h3>
          {row.nameAr ? (
            <p className="text-sm text-muted-foreground" dir="rtl">
              {row.nameAr}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-muted-foreground">
            /occasions?occasion={row.slug} · {row.giftBasketIds.length}{" "}
            {t("admin.occasions.basketsCount")} · {row.giftCardProductIds.length}{" "}
            {t("admin.occasions.cardsCount")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={toggleEnabled}
            className="border-border"
          >
            {row.enabled ? t("admin.occasions.disable") : t("admin.occasions.enable")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => setEditing((v) => !v)}
            className="border-border"
          >
            {editing ? t("admin.blog.cancel") : t("admin.blog.edit")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={remove}
            className="border-red-500/30 text-red-300"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
      {editing ? (
        <div className="mt-4 space-y-4 border-t border-border pt-4">
          <OccasionFields
            draft={draft}
            setDraft={setDraft}
            baskets={baskets}
            giftCards={giftCards}
          />
          <Button
            type="button"
            disabled={busy}
            onClick={save}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {t("admin.blog.save")}
          </Button>
        </div>
      ) : null}
    </article>
  );
}

export function GiftOccasionsAdmin({ occasions, baskets, giftCards }: Props) {
  const { t } = useI18n();
  const [draft, setDraft] = React.useState<GiftOccasionForm>(emptyForm);
  const [busy, setBusy] = React.useState(false);

  async function create() {
    setBusy(true);
    try {
      await createGiftOccasion(draft);
      toast.success(t("admin.occasions.created"));
      setDraft(emptyForm());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("admin.products.error.create"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-card/40 p-5">
        <h2 className="font-heading text-xl text-foreground">
          {t("admin.occasions.create")}
        </h2>
        <div className="mt-4">
          <OccasionFields
            draft={draft}
            setDraft={setDraft}
            baskets={baskets}
            giftCards={giftCards}
          />
        </div>
        <Button
          type="button"
          disabled={busy}
          onClick={create}
          className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {t("admin.occasions.createBtn")}
        </Button>
      </section>

      <section className="space-y-4">
        {occasions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("admin.occasions.empty")}</p>
        ) : (
          occasions.map((row) => (
            <OccasionRow
              key={row.id}
              row={row}
              baskets={baskets}
              giftCards={giftCards}
            />
          ))
        )}
      </section>
    </div>
  );
}
