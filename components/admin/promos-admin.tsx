"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PromoDiscountType } from "@prisma/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useI18n } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";
import { MENU_CATEGORY_ORDER, getCategoryLabel } from "@/lib/categories";
import {
  createPromoCode,
  deletePromoCode,
  setPromoCodeEnabled,
  updatePromoCode,
  type PromoCodeFormInput,
} from "@/actions/promos-admin";

export type PromoAdminDTO = {
  id: string;
  code: string;
  description: string;
  discountType: PromoDiscountType;
  discountValue: number;
  startsAt: string | null;
  endsAt: string | null;
  minOrderAmount: number | null;
  maxUses: number | null;
  maxUsesPerCustomer: number | null;
  usedCount: number;
  isPublic: boolean;
  enabled: boolean;
  productIds: string[];
  categories: string[];
};

type ProductOption = {
  id: string;
  name: string;
  nameAr: string;
  category: string;
};

type Props = {
  promos: Array<{
    id: string;
    code: string;
    description: string;
    discountType: PromoDiscountType;
    discountValue: { toString(): string };
    startsAt: Date | null;
    endsAt: Date | null;
    minOrderAmount: { toString(): string } | null;
    maxUses: number | null;
    maxUsesPerCustomer: number | null;
    usedCount: number;
    isPublic: boolean;
    enabled: boolean;
    products: { productId: string }[];
    categories: { category: string }[];
  }>;
  products: ProductOption[];
  dbOffline: boolean;
};

function parseDt(s: string | null): Date | null {
  if (!s || !String(s).trim()) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toDto(row: Props["promos"][number]): PromoAdminDTO {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    discountType: row.discountType,
    discountValue: Number(row.discountValue),
    startsAt: row.startsAt ? row.startsAt.toISOString().slice(0, 16) : null,
    endsAt: row.endsAt ? row.endsAt.toISOString().slice(0, 16) : null,
    minOrderAmount:
      row.minOrderAmount != null ? Number(row.minOrderAmount) : null,
    maxUses: row.maxUses,
    maxUsesPerCustomer: row.maxUsesPerCustomer,
    usedCount: row.usedCount,
    isPublic: row.isPublic,
    enabled: row.enabled,
    productIds: row.products.map((p) => p.productId),
    categories: row.categories.map((c) => c.category),
  };
}

function toFormInput(draft: PromoAdminDTO): PromoCodeFormInput {
  return {
    code: draft.code,
    description: draft.description,
    discountType: draft.discountType,
    discountValue: Number(draft.discountValue),
    startsAt: parseDt(draft.startsAt),
    endsAt: parseDt(draft.endsAt),
    minOrderAmount: draft.minOrderAmount,
    maxUses: draft.maxUses,
    maxUsesPerCustomer: draft.maxUsesPerCustomer,
    isPublic: draft.isPublic,
    enabled: draft.enabled,
    productIds: draft.productIds,
    categories: draft.categories,
  };
}

function ScopePicker({
  draft,
  setDraft,
  products,
}: {
  draft: PromoAdminDTO;
  setDraft: React.Dispatch<React.SetStateAction<PromoAdminDTO>>;
  products: ProductOption[];
}) {
  const { t, locale } = useI18n();
  const [applyToAll, setApplyToAll] = React.useState(
    draft.categories.length === 0 && draft.productIds.length === 0
  );

  function toggleAll(v: boolean) {
    setApplyToAll(v);
    if (v) {
      // Whole-cart scope is represented by empty category & product lists.
      setDraft((d) => ({ ...d, categories: [], productIds: [] }));
    }
  }

  function toggleCategory(cat: string) {
    setDraft((d) => ({
      ...d,
      categories: d.categories.includes(cat)
        ? d.categories.filter((c) => c !== cat)
        : [...d.categories, cat],
    }));
  }

  function toggleProduct(id: string) {
    setDraft((d) => ({
      ...d,
      productIds: d.productIds.includes(id)
        ? d.productIds.filter((p) => p !== id)
        : [...d.productIds, id],
    }));
  }

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-medium">
        <Checkbox
          checked={applyToAll}
          onCheckedChange={(v) => toggleAll(v === true)}
        />
        {t("admin.promos.applyAll")}
      </label>
      <div
        className={cn(
          "grid gap-4 lg:grid-cols-2",
          applyToAll && "pointer-events-none opacity-50"
        )}
      >
        <div className="space-y-2">
          <Label>{t("admin.promos.categories")}</Label>
          <p className="text-xs text-muted-foreground">
            {t("admin.promos.scopeHint")}
          </p>
          <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
            {MENU_CATEGORY_ORDER.map((cat) => (
              <label key={cat} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={draft.categories.includes(cat)}
                  disabled={applyToAll}
                  onCheckedChange={() => toggleCategory(cat)}
                />
                {getCategoryLabel(cat, locale)}
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>{t("admin.promos.products")}</Label>
          <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
            {products.map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={draft.productIds.includes(p.id)}
                  disabled={applyToAll}
                  onCheckedChange={() => toggleProduct(p.id)}
                />
                <span>
                  {locale === "ar" && p.nameAr ? p.nameAr : p.name}
                  <span className="ms-2 text-xs text-muted-foreground">
                    {getCategoryLabel(p.category, locale)}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PromoFields({
  draft,
  setDraft,
  products,
}: {
  draft: PromoAdminDTO;
  setDraft: React.Dispatch<React.SetStateAction<PromoAdminDTO>>;
  products: ProductOption[];
}) {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="space-y-1">
          <Label>{t("admin.promos.code")}</Label>
          <Input
            value={draft.code}
            onChange={(e) =>
              setDraft((d) => ({ ...d, code: e.target.value.toUpperCase() }))
            }
            className="border-border bg-card font-mono text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label>{t("admin.promos.type")}</Label>
          <select
            className="flex h-9 w-full rounded-md border border-border bg-card px-2 text-sm"
            value={draft.discountType}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                discountType: e.target.value as PromoDiscountType,
              }))
            }
          >
            <option value={PromoDiscountType.PERCENT}>
              {t("admin.promos.percent")}
            </option>
            <option value={PromoDiscountType.FIXED}>
              {t("admin.promos.fixed")}
            </option>
            <option value={PromoDiscountType.FREE_SHIPPING}>
              {t("admin.promos.freeShipping")}
            </option>
          </select>
        </div>
        <div className="space-y-1">
          <Label>{t("admin.promos.value")}</Label>
          <Input
            type="number"
            step="0.001"
            value={draft.discountValue}
            disabled={draft.discountType === PromoDiscountType.FREE_SHIPPING}
            onChange={(e) =>
              setDraft((d) => ({ ...d, discountValue: Number(e.target.value) }))
            }
            className="border-border bg-card"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label>{t("admin.promos.description")}</Label>
        <Textarea
          rows={2}
          value={draft.description}
          onChange={(e) =>
            setDraft((d) => ({ ...d, description: e.target.value }))
          }
          className="border-border bg-card"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-4">
        <div className="space-y-1">
          <Label>{t("admin.promos.minOrder")}</Label>
          <Input
            type="number"
            step="0.001"
            value={draft.minOrderAmount ?? ""}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                minOrderAmount:
                  e.target.value === "" ? null : Number(e.target.value),
              }))
            }
            className="border-border bg-card"
          />
        </div>
        <div className="space-y-1">
          <Label>{t("admin.promos.maxUses")}</Label>
          <Input
            type="number"
            min={0}
            value={draft.maxUses ?? ""}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                maxUses: e.target.value === "" ? null : Number(e.target.value),
              }))
            }
            className="border-border bg-card"
          />
        </div>
        <div className="space-y-1">
          <Label>{t("admin.promos.maxUsesCustomer")}</Label>
          <Input
            type="number"
            min={0}
            value={draft.maxUsesPerCustomer ?? ""}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                maxUsesPerCustomer:
                  e.target.value === "" ? null : Number(e.target.value),
              }))
            }
            className="border-border bg-card"
          />
        </div>
        <div className="space-y-1">
          <Label>{t("admin.promos.usedCount")}</Label>
          <Input
            value={draft.usedCount}
            disabled
            className="border-border bg-card"
          />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-1">
          <Label>{t("admin.promos.starts")}</Label>
          <Input
            type="datetime-local"
            value={draft.startsAt ?? ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, startsAt: e.target.value || null }))
            }
            className="border-border bg-card"
          />
        </div>
        <div className="space-y-1">
          <Label>{t("admin.promos.ends")}</Label>
          <Input
            type="datetime-local"
            value={draft.endsAt ?? ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, endsAt: e.target.value || null }))
            }
            className="border-border bg-card"
          />
        </div>
      </div>

      <ScopePicker draft={draft} setDraft={setDraft} products={products} />

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={draft.enabled}
            onCheckedChange={(v) =>
              setDraft((d) => ({ ...d, enabled: Boolean(v) }))
            }
          />
          {t("admin.promos.enabled")}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={draft.isPublic}
            onCheckedChange={(v) =>
              setDraft((d) => ({ ...d, isPublic: Boolean(v) }))
            }
          />
          {t("admin.promos.public")}
        </label>
      </div>
    </div>
  );
}

function PromoRow({
  row,
  products,
  dbOffline,
}: {
  row: PromoAdminDTO;
  products: ProductOption[];
  dbOffline: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [draft, setDraft] = React.useState(row);

  React.useEffect(() => {
    setDraft(row);
  }, [row]);

  async function save() {
    setBusy(true);
    try {
      await updatePromoCode(row.id, toFormInput(draft));
      toast.success(t("admin.products.toast.updated"));
      router.refresh();
    } catch {
      toast.error(t("admin.products.error.update"));
    }
    setBusy(false);
  }

  async function remove() {
    if (!window.confirm(t("admin.promos.delete") + "?")) return;
    setBusy(true);
    try {
      await deletePromoCode(row.id);
      toast.success(t("admin.products.toast.deleted"));
      router.refresh();
    } catch {
      toast.error(t("admin.products.error.delete"));
    }
    setBusy(false);
  }

  async function toggleEnabled() {
    setBusy(true);
    try {
      await setPromoCodeEnabled(row.id, !draft.enabled);
      router.refresh();
    } catch {
      toast.error(t("admin.products.error.update"));
    }
    setBusy(false);
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card/50 p-4">
      <PromoFields draft={draft} setDraft={setDraft} products={products} />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={busy || dbOffline}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => void save()}
        >
          {t("admin.promos.save")}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy || dbOffline}
          onClick={() => void toggleEnabled()}
        >
          {draft.enabled ? t("admin.promos.disable") : t("admin.promos.enable")}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy || dbOffline}
          onClick={() => void remove()}
        >
          {t("admin.promos.delete")}
        </Button>
      </div>
    </div>
  );
}

const emptyDraft: PromoAdminDTO = {
  id: "",
  code: "",
  description: "",
  discountType: PromoDiscountType.PERCENT,
  discountValue: 10,
  startsAt: null,
  endsAt: null,
  minOrderAmount: null,
  maxUses: null,
  maxUsesPerCustomer: null,
  usedCount: 0,
  isPublic: true,
  enabled: true,
  productIds: [],
  categories: [],
};

export function PromosAdmin({ promos, products, dbOffline }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createDraft, setCreateDraft] = React.useState<PromoAdminDTO>(emptyDraft);
  const rows = promos.map(toDto);

  function openCreate() {
    setCreateDraft(emptyDraft);
    setCreateOpen(true);
  }

  function cancelCreate() {
    setCreateDraft(emptyDraft);
    setCreateOpen(false);
  }

  async function add() {
    if (!createDraft.code.trim()) {
      toast.error(t("admin.promos.code"));
      return;
    }
    setBusy(true);
    try {
      await createPromoCode(toFormInput(createDraft));
      toast.success(t("admin.products.toast.created"));
      setCreateDraft(emptyDraft);
      setCreateOpen(false);
      router.refresh();
    } catch {
      toast.error(t("admin.products.error.create"));
    }
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      {dbOffline && (
        <p className="rounded-xl border border-border bg-primary/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          {t("admin.products.dbOffline")}
        </p>
      )}

      {/* Top action: open the create form on demand */}
      <div className="flex justify-end">
        <Button
          type="button"
          disabled={busy || dbOffline || createOpen}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={openCreate}
        >
          <Plus className="size-4" />
          {t("admin.promos.new")}
        </Button>
      </div>

      {createOpen && (
        <div className="space-y-4 rounded-xl border border-primary/40 bg-primary/5 p-4">
          <p className="text-sm font-medium text-primary/90">
            {t("admin.promos.createTitle")}
          </p>
          <PromoFields
            draft={createDraft}
            setDraft={setCreateDraft}
            products={products}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={busy || dbOffline || !createDraft.code.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => void add()}
            >
              {t("admin.promos.add")}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={cancelCreate}
            >
              {t("admin.promos.cancel")}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("admin.promos.empty")}</p>
        ) : (
          rows.map((r) => (
            <PromoRow
              key={r.id}
              row={r}
              products={products}
              dbOffline={dbOffline}
            />
          ))
        )}
      </div>
    </div>
  );
}
