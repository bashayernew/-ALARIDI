"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  GiftBasketPricingMode,
  GiftBasketVisibility,
} from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/components/i18n/i18n-provider";
import { formatKwd } from "@/lib/format";
import type { GiftBasketAdminDTO } from "@/lib/gift-baskets";
import {
  createGiftBasket,
  deleteGiftBasket,
  setGiftBasketVisibility,
  updateGiftBasket,
  uploadGiftBasketImage,
  type GiftBasketForm,
} from "@/actions/gift-baskets-admin";

type CatalogProduct = {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
};

type OccasionOption = { id: string; nameEn: string };

type Props = {
  baskets: GiftBasketAdminDTO[];
  products: CatalogProduct[];
  occasions: OccasionOption[];
};

type ItemDraft = { productId: string; quantity: number; sortOrder: number };

function emptyForm(): GiftBasketForm {
  return {
    nameEn: "",
    nameAr: "",
    descriptionEn: "",
    descriptionAr: "",
    image: "",
    pricingMode: GiftBasketPricingMode.AUTO,
    manualPrice: null,
    visibility: GiftBasketVisibility.DRAFT,
    sortOrder: 0,
    isFeatured: false,
    isSeasonal: false,
    isNew: false,
    isBestSeller: false,
    includeGiftWrap: true,
    showOnGiftsPage: false,
    items: [],
    occasionIds: [],
  };
}

function basketToForm(row: GiftBasketAdminDTO): GiftBasketForm {
  return {
    nameEn: row.nameEn,
    nameAr: row.nameAr,
    descriptionEn: row.descriptionEn,
    descriptionAr: row.descriptionAr,
    image: row.image,
    pricingMode: row.pricingMode,
    manualPrice: row.manualPriceKwd,
    visibility: row.visibility,
    sortOrder: row.sortOrder,
    isFeatured: row.isFeatured,
    isSeasonal: row.isSeasonal,
    isNew: row.isNew,
    isBestSeller: row.isBestSeller,
    includeGiftWrap: row.includeGiftWrap,
    showOnGiftsPage: row.showOnGiftsPage,
    items: row.items.map((item, i) => ({
      productId: item.productId,
      quantity: item.quantity,
      sortOrder: i,
    })),
    occasionIds: [...row.occasionIds],
  };
}

function OccasionPicker({
  selected,
  occasions,
  onChange,
}: {
  selected: string[];
  occasions: OccasionOption[];
  onChange: (ids: string[]) => void;
}) {
  const { t } = useI18n();

  function toggle(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id]
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-border bg-card/30 p-3">
      <Label>{t("admin.giftBaskets.occasions")}</Label>
      <p className="text-xs text-muted-foreground">
        {t("admin.giftBaskets.occasionsHint")}
      </p>
      {occasions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("admin.giftBaskets.noOccasions")}
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {occasions.map((o) => (
            <label
              key={o.id}
              className="flex items-center gap-2 text-sm text-foreground"
            >
              <Checkbox
                checked={selected.includes(o.id)}
                onCheckedChange={() => toggle(o.id)}
              />
              {o.nameEn}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function ItemEditor({
  items,
  products,
  onChange,
}: {
  items: ItemDraft[];
  products: CatalogProduct[];
  onChange: (items: ItemDraft[]) => void;
}) {
  const { t } = useI18n();
  const [pickId, setPickId] = React.useState("");

  function addItem() {
    if (!pickId || items.some((i) => i.productId === pickId)) return;
    onChange([
      ...items,
      { productId: pickId, quantity: 1, sortOrder: items.length },
    ]);
    setPickId("");
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card/30 p-3">
      <Label>{t("admin.giftBaskets.products")}</Label>
      <div className="flex flex-wrap gap-2">
        <Select value={pickId} onValueChange={(v) => setPickId(v ?? "")}>
          <SelectTrigger className="min-w-[220px] border-border bg-card">
            <SelectValue placeholder={t("admin.giftBaskets.pickProduct")} />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id} disabled={!p.isAvailable}>
                {p.name} · {formatKwd(Number(p.price))}
                {!p.isAvailable ? " (unavailable)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="size-4" /> {t("admin.giftBaskets.addProduct")}
        </Button>
      </div>
      <ul className="space-y-2">
        {items.map((item, idx) => {
          const product = products.find((p) => p.id === item.productId);
          return (
            <li
              key={item.productId}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-2"
            >
              <span className="min-w-0 flex-1 text-sm text-foreground">
                {product?.name ?? item.productId}
              </span>
              <Input
                type="number"
                min={1}
                className="h-8 w-20 border-border bg-card"
                value={item.quantity}
                onChange={(e) => {
                  const next = [...items];
                  next[idx] = {
                    ...item,
                    quantity: Math.max(1, Number(e.target.value) || 1),
                  };
                  onChange(next);
                }}
              />
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() => onChange(items.filter((_, i) => i !== idx))}
              >
                <Trash2 className="size-4 text-red-400" />
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function BasketFormFields({
  draft,
  setDraft,
  products,
  occasions,
  file,
  setFile,
}: {
  draft: GiftBasketForm;
  setDraft: React.Dispatch<React.SetStateAction<GiftBasketForm>>;
  products: CatalogProduct[];
  occasions: OccasionOption[];
  file: File | null;
  setFile: (f: File | null) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      <div className="space-y-1">
        <Label>{t("admin.giftBaskets.nameEn")}</Label>
        <Input
          value={draft.nameEn}
          onChange={(e) => setDraft((d) => ({ ...d, nameEn: e.target.value }))}
          className="border-border bg-card"
        />
      </div>
      <div className="space-y-1">
        <Label>{t("admin.giftBaskets.nameAr")}</Label>
        <Input
          value={draft.nameAr}
          onChange={(e) => setDraft((d) => ({ ...d, nameAr: e.target.value }))}
          className="border-border bg-card"
        />
      </div>
      <div className="space-y-1">
        <Label>{t("admin.giftBaskets.sortOrder")}</Label>
        <Input
          type="number"
          value={draft.sortOrder}
          onChange={(e) =>
            setDraft((d) => ({ ...d, sortOrder: Number(e.target.value) }))
          }
          className="border-border bg-card"
        />
      </div>
      <div className="space-y-1 md:col-span-2">
        <Label>{t("admin.giftBaskets.imageUrl")}</Label>
        <Input
          value={draft.image}
          onChange={(e) => setDraft((d) => ({ ...d, image: e.target.value }))}
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
        <Label>{t("admin.giftBaskets.descriptionEn")}</Label>
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
        <Label>{t("admin.giftBaskets.descriptionAr")}</Label>
        <Textarea
          rows={2}
          value={draft.descriptionAr}
          onChange={(e) =>
            setDraft((d) => ({ ...d, descriptionAr: e.target.value }))
          }
          className="border-border bg-card"
        />
      </div>
      <div className="space-y-1">
        <Label>{t("admin.giftBaskets.pricingMode")}</Label>
        <select
          className="flex h-9 w-full rounded-md border border-border bg-card px-2 text-sm"
          value={draft.pricingMode}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              pricingMode: e.target.value as GiftBasketPricingMode,
            }))
          }
        >
          <option value={GiftBasketPricingMode.AUTO}>
            {t("admin.giftBaskets.pricing.auto")}
          </option>
          <option value={GiftBasketPricingMode.MANUAL}>
            {t("admin.giftBaskets.pricing.manual")}
          </option>
        </select>
      </div>
      {draft.pricingMode === GiftBasketPricingMode.MANUAL ? (
        <div className="space-y-1">
          <Label>{t("admin.giftBaskets.manualPrice")}</Label>
          <Input
            type="number"
            step="0.001"
            value={draft.manualPrice ?? ""}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                manualPrice:
                  e.target.value === "" ? null : Number(e.target.value),
              }))
            }
            className="border-border bg-card"
          />
        </div>
      ) : null}
      <div className="space-y-1">
        <Label>{t("admin.giftBaskets.visibility")}</Label>
        <select
          className="flex h-9 w-full rounded-md border border-border bg-card px-2 text-sm"
          value={draft.visibility}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              visibility: e.target.value as GiftBasketVisibility,
            }))
          }
        >
          <option value={GiftBasketVisibility.PUBLISHED}>
            {t("admin.giftBaskets.visibility.published")}
          </option>
          <option value={GiftBasketVisibility.DRAFT}>
            {t("admin.giftBaskets.visibility.draft")}
          </option>
          <option value={GiftBasketVisibility.HIDDEN}>
            {t("admin.giftBaskets.visibility.hidden")}
          </option>
        </select>
      </div>
      <div className="flex flex-wrap gap-4 md:col-span-2 lg:col-span-3">
        {(
          [
            ["isFeatured", t("admin.giftBaskets.flag.featured")],
            ["isSeasonal", t("admin.giftBaskets.flag.seasonal")],
            ["isNew", t("admin.giftBaskets.flag.new")],
            ["isBestSeller", t("admin.giftBaskets.flag.bestSeller")],
            ["includeGiftWrap", t("admin.giftBaskets.includeWrap")],
            ["showOnGiftsPage", t("admin.giftBaskets.showOnGifts")],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={draft[key]}
              onCheckedChange={(v) =>
                setDraft((d) => ({ ...d, [key]: Boolean(v) }))
              }
            />
            {label}
          </label>
        ))}
      </div>
      <div className="md:col-span-2 lg:col-span-3">
        <ItemEditor
          items={draft.items}
          products={products}
          onChange={(items) => setDraft((d) => ({ ...d, items }))}
        />
      </div>
      <div className="md:col-span-2 lg:col-span-3">
        <OccasionPicker
          selected={draft.occasionIds}
          occasions={occasions}
          onChange={(occasionIds) => setDraft((d) => ({ ...d, occasionIds }))}
        />
      </div>
    </div>
  );
}

function BasketRow({
  row,
  products,
  occasions,
}: {
  row: GiftBasketAdminDTO;
  products: CatalogProduct[];
  occasions: OccasionOption[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [draft, setDraft] = React.useState<GiftBasketForm>(() => basketToForm(row));
  const [file, setFile] = React.useState<File | null>(null);

  React.useEffect(() => {
    setDraft(basketToForm(row));
  }, [row]);

  async function save() {
    setBusy(true);
    try {
      let image = draft.image;
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        image = await uploadGiftBasketImage(fd);
      }
      await updateGiftBasket(row.id, { ...draft, image });
      toast.success(t("admin.products.toast.updated"));
      setFile(null);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("admin.products.error.update"));
    }
    setBusy(false);
  }

  async function remove() {
    if (!window.confirm(t("admin.giftBaskets.delete") + "?")) return;
    setBusy(true);
    try {
      await deleteGiftBasket(row.id);
      toast.success(t("admin.products.toast.deleted"));
      router.refresh();
    } catch {
      toast.error(t("admin.products.error.delete"));
    }
    setBusy(false);
  }

  async function publish() {
    setBusy(true);
    try {
      await setGiftBasketVisibility(row.id, GiftBasketVisibility.PUBLISHED);
      router.refresh();
    } catch {
      toast.error(t("admin.products.error.update"));
    }
    setBusy(false);
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card/50 p-4">
      <div className="flex flex-wrap items-start gap-4">
        <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-lg bg-card">
          {draft.image ? (
            <Image src={draft.image} alt={draft.nameEn} fill className="object-cover" sizes="144px" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-medium text-foreground">{row.nameEn}</p>
          <p className="text-sm text-primary tabular-nums">
            {formatKwd(row.priceKwd)} · {row.visibility}
          </p>
        </div>
      </div>
      <BasketFormFields
        draft={draft}
        setDraft={setDraft}
        products={products}
        occasions={occasions}
        file={file}
        setFile={setFile}
      />
      <div className="flex flex-wrap gap-2">
        {row.visibility !== GiftBasketVisibility.PUBLISHED ? (
          <Button type="button" variant="outline" disabled={busy} onClick={publish}>
            {t("admin.giftBaskets.publish")}
          </Button>
        ) : null}
        <Button type="button" variant="outline" disabled={busy} onClick={remove}>
          {t("admin.giftBaskets.delete")}
        </Button>
        <Button type="button" disabled={busy} onClick={save}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          {t("admin.banners.save")}
        </Button>
      </div>
    </div>
  );
}

export function GiftBasketsAdmin({ baskets, products, occasions }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const [draft, setDraft] = React.useState<GiftBasketForm>(emptyForm);
  const [file, setFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [showCreate, setShowCreate] = React.useState(false);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      let image = draft.image.trim();
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        image = await uploadGiftBasketImage(fd);
      }
      if (!image) {
        toast.error(t("admin.products.error.noImage"));
        setBusy(false);
        return;
      }
      await createGiftBasket({ ...draft, image });
      toast.success(t("admin.giftBaskets.created"));
      setDraft(emptyForm());
      setFile(null);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("admin.products.error.create"));
    }
    setBusy(false);
  }

  return (
    <div className="space-y-8">
      <Button
        type="button"
        className="rounded-xl"
        onClick={() => setShowCreate((v) => !v)}
      >
        {showCreate
          ? t("admin.giftBaskets.close")
          : `+ ${t("admin.giftBaskets.create")}`}
      </Button>
      {showCreate ? (
      <form
        onSubmit={onCreate}
        className="space-y-4 rounded-2xl border border-border bg-card/40 p-4"
      >
        <p className="text-sm font-medium text-foreground">
          {t("admin.giftBaskets.create")}
        </p>
        <BasketFormFields
          draft={draft}
          setDraft={setDraft}
          products={products}
          occasions={occasions}
          file={file}
          setFile={setFile}
        />
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          {t("admin.giftBaskets.createBtn")}
        </Button>
      </form>
      ) : null}

      <div className="space-y-4">
        {baskets.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("admin.giftBaskets.empty")}</p>
        ) : (
          baskets.map((row) => (
            <BasketRow
              key={row.id}
              row={row}
              products={products}
              occasions={occasions}
            />
          ))
        )}
      </div>
    </div>
  );
}
