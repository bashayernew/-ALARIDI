"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  createProduct,
  deleteProduct,
  updateProduct,
  uploadProductImage,
} from "@/actions/products-admin";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/actions/categories-admin";
import { getCategoryLabel, type CategoryDTO } from "@/lib/categories";
import { useI18n } from "@/components/i18n/i18n-provider";

/** Thumbnail that falls back to a gradient + initials when the image fails. */
function ProductThumb({ src, name }: { src: string; name: string }) {
  const [err, setErr] = React.useState(false);
  if (err || !src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent via-card to-background text-[9px] font-semibold uppercase text-primary/80">
        {name.slice(0, 2)}
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt=""
      fill
      className="object-cover"
      sizes="48px"
      onError={() => setErr(true)}
      unoptimized
    />
  );
}

/** Inline, editable price cell — saves the new base price to the catalog. */
function EditablePrice({ id, price }: { id: string; price: number }) {
  const { t } = useI18n();
  const router = useRouter();
  const [value, setValue] = React.useState(price.toFixed(3));
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    setValue(price.toFixed(3));
  }, [price]);

  const parsed = Number(value);
  const dirty =
    value.trim() !== "" &&
    Number.isFinite(parsed) &&
    Math.abs(parsed - price) > 0.0005;

  async function save() {
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error(t("admin.products.error.update"));
      return;
    }
    setBusy(true);
    try {
      await updateProduct(id, { price: Math.round(parsed * 1000) / 1000 });
      toast.success(t("admin.products.toast.updated"));
      router.refresh();
    } catch {
      toast.error(t("admin.products.error.update"));
    }
    setBusy(false);
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (dirty) void save();
          }
        }}
        inputMode="decimal"
        aria-label={t("admin.products.th.price")}
        className="h-9 w-24 tabular-nums"
      />
      {dirty ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => void save()}
        >
          {t("admin.products.priceSave")}
        </Button>
      ) : null}
    </div>
  );
}

/** Plain (serializable) product row — no Prisma Decimal/Date objects. */
export type AdminProduct = {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  image: string;
  category: string;
  price: number;
  sellByWeight: boolean;
  price500g: number | null;
  price1kg: number | null;
  weightOptions: { label: string; price: number }[] | null;
  isBestSeller: boolean;
  isPromo: boolean;
  isAvailable: boolean;
  isNew: boolean;
};

type SizeRow = { label: string; price: string };

function defaultSizeRows(p?: AdminProduct): SizeRow[] {
  if (p?.weightOptions && p.weightOptions.length > 0) {
    return p.weightOptions.map((o) => ({
      label: o.label,
      price: o.price.toFixed(3),
    }));
  }
  if (p) {
    return [
      { label: "250 g", price: p.price.toFixed(3) },
      { label: "500 g", price: (p.price500g ?? p.price * 2).toFixed(3) },
      { label: "1 kg", price: (p.price1kg ?? p.price * 4).toFixed(3) },
    ];
  }
  return [
    { label: "250 g", price: "" },
    { label: "500 g", price: "" },
    { label: "1 kg", price: "" },
  ];
}

function rowsToWeightOptions(
  rows: SizeRow[]
): { label: string; price: number }[] | null {
  const out = rows
    .filter((r) => r.label.trim() && Number.isFinite(Number(r.price)) && r.price.trim() !== "")
    .map((r) => ({
      label: r.label.trim(),
      price: Math.round(Number(r.price) * 1000) / 1000,
    }));
  return out.length > 0 ? out : null;
}

/** Editable list of weight/price rows shown when "Sold by weight" is on. */
function SizeRowsEditor({
  rows,
  onChange,
  idPrefix,
}: {
  rows: SizeRow[];
  onChange: (rows: SizeRow[]) => void;
  idPrefix: string;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs text-muted-foreground">
        <span>{t("admin.products.weights.weight")}</span>
        <span>{t("admin.products.weights.price")}</span>
        <span />
      </div>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
          <Input
            id={`${idPrefix}-w-${i}`}
            value={r.label}
            onChange={(e) =>
              onChange(rows.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
            }
            placeholder="250 g"
          />
          <Input
            id={`${idPrefix}-p-${i}`}
            type="number"
            step="0.001"
            min="0"
            value={r.price}
            onChange={(e) =>
              onChange(rows.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))
            }
            placeholder="0.000"
            className="tabular-nums"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive"
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
            aria-label="Remove"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-lg"
        onClick={() => onChange([...rows, { label: "", price: "" }])}
      >
        <Plus className="size-4" />
        {t("admin.products.weights.add")}
      </Button>
      <p className="text-[11px] leading-snug text-muted-foreground">
        {t("admin.products.weightHint")}
      </p>
    </div>
  );
}

/** Edit an existing product: image, name, category, price (and flags). */
function EditProductDialog({
  product,
  categories,
}: {
  product: AdminProduct;
  categories: CategoryDTO[];
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(product.name);
  const [nameAr, setNameAr] = React.useState(product.nameAr);
  const [description, setDescription] = React.useState(product.description);
  const [descriptionAr, setDescriptionAr] = React.useState(product.descriptionAr);
  const [category, setCategory] = React.useState<string>(product.category);
  const [price, setPrice] = React.useState(product.price.toFixed(3));
  const [sellByWeight, setSellByWeight] = React.useState(product.sellByWeight);
  const [sizeRows, setSizeRows] = React.useState<SizeRow[]>(
    defaultSizeRows(product)
  );
  const [imageUrl, setImageUrl] = React.useState(product.image);
  const [file, setFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);

  // Re-sync the form to the product whenever the dialog (re)opens.
  React.useEffect(() => {
    if (!open) return;
    setName(product.name);
    setNameAr(product.nameAr);
    setDescription(product.description);
    setDescriptionAr(product.descriptionAr);
    setCategory(product.category);
    setPrice(product.price.toFixed(3));
    setSellByWeight(product.sellByWeight);
    setSizeRows(defaultSizeRows(product));
    setImageUrl(product.image);
    setFile(null);
  }, [open, product]);

  const previewSrc = file ? URL.createObjectURL(file) : imageUrl;

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t("admin.products.error.update"));
      return;
    }
    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      toast.error(t("admin.products.error.update"));
      return;
    }
    setBusy(true);
    try {
      let image = imageUrl.trim();
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        image = await uploadProductImage(fd);
      }
      await updateProduct(product.id, {
        name: name.trim(),
        nameAr: nameAr.trim(),
        description: description.trim(),
        descriptionAr: descriptionAr.trim(),
        category,
        price: Math.round(parsedPrice * 1000) / 1000,
        sellByWeight,
        weightOptions: sellByWeight ? rowsToWeightOptions(sizeRows) : null,
        image: image || product.image,
      });
      toast.success(t("admin.products.toast.updated"));
      setOpen(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error(t("admin.products.error.update"), {
        description: err instanceof Error ? err.message : undefined,
      });
    }
    setBusy(false);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        {t("admin.products.edit")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.products.editTitle")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSave} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                <ProductThumb src={previewSrc} name={name} />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor={`edit-file-${product.id}`}>
                  {t("admin.products.label.upload")}
                </Label>
                <Input
                  id={`edit-file-${product.id}`}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-imgurl-${product.id}`}>
                {t("admin.products.label.imageUrl")}
              </Label>
              <Input
                id={`edit-imgurl-${product.id}`}
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder={t("admin.products.placeholder.imageUrl")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-name-${product.id}`}>
                {t("admin.products.label.name")}
              </Label>
              <Input
                id={`edit-name-${product.id}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-namear-${product.id}`}>
                {t("admin.products.label.nameAr")}
              </Label>
              <Input
                id={`edit-namear-${product.id}`}
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-desc-${product.id}`}>
                {t("admin.products.label.description")}
              </Label>
              <Textarea
                id={`edit-desc-${product.id}`}
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-descar-${product.id}`}>
                {t("admin.products.label.descriptionAr")}
              </Label>
              <Textarea
                id={`edit-descar-${product.id}`}
                rows={2}
                value={descriptionAr}
                onChange={(e) => setDescriptionAr(e.target.value)}
                dir="rtl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("admin.products.label.category")}</Label>
                <Select
                  value={category}
                  onValueChange={(v) => {
                    if (v) setCategory(v);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.key} value={c.key}>
                        {locale === "ar" && c.nameAr.trim() ? c.nameAr : c.nameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`edit-price-${product.id}`}>
                  {t("admin.products.label.price")}
                </Label>
                <Input
                  id={`edit-price-${product.id}`}
                  type="number"
                  step="0.001"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="tabular-nums"
                  required
                />
                <p className="text-[11px] leading-snug text-muted-foreground">
                  {t("admin.products.priceHint")}
                </p>
              </div>
              <div className="space-y-3 rounded-xl border border-border/60 bg-card/40 p-3">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={sellByWeight}
                    onCheckedChange={(v) => setSellByWeight(v === true)}
                  />
                  {t("admin.products.label.sellByWeight")}
                </label>
                {sellByWeight ? (
                  <SizeRowsEditor
                    rows={sizeRows}
                    onChange={setSizeRows}
                    idPrefix={`edit-${product.id}`}
                  />
                ) : null}
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={busy} className="rounded-xl">
                {busy
                  ? t("admin.products.submit.saving")
                  : t("admin.products.submit.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** A single editable category row. */
function CategoryRow({ cat }: { cat: CategoryDTO }) {
  const { t } = useI18n();
  const router = useRouter();
  const [nameEn, setNameEn] = React.useState(cat.nameEn);
  const [nameAr, setNameAr] = React.useState(cat.nameAr);
  const [sortOrder, setSortOrder] = React.useState(cat.sortOrder);
  const [isActive, setIsActive] = React.useState(cat.isActive);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    setNameEn(cat.nameEn);
    setNameAr(cat.nameAr);
    setSortOrder(cat.sortOrder);
    setIsActive(cat.isActive);
  }, [cat]);

  async function save() {
    setBusy(true);
    try {
      await updateCategory(cat.id, { nameEn, nameAr, sortOrder, isActive });
      toast.success(t("admin.products.toast.updated"));
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("admin.products.error.update"));
    }
    setBusy(false);
  }

  async function remove() {
    if (!confirm(t("admin.categories.confirmDelete"))) return;
    setBusy(true);
    try {
      await deleteCategory(cat.id);
      toast.success(t("admin.products.toast.deleted"));
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("admin.products.error.delete"));
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border/60 bg-card/60 p-3">
      <div className="space-y-1">
        <Label className="text-xs">{t("admin.categories.nameEn")}</Label>
        <Input
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          className="h-8 w-40"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{t("admin.categories.nameAr")}</Label>
        <Input
          value={nameAr}
          onChange={(e) => setNameAr(e.target.value)}
          dir="rtl"
          className="h-8 w-40"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{t("admin.categories.order")}</Label>
        <Input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
          className="h-8 w-20"
        />
      </div>
      <label className="flex h-8 items-center gap-2 text-xs">
        <Checkbox
          checked={isActive}
          onCheckedChange={(v) => setIsActive(v === true)}
        />
        {t("admin.categories.active")}
      </label>
      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={save}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : t("admin.banners.save")}
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        disabled={busy}
        onClick={remove}
        aria-label={t("admin.categories.delete")}
      >
        <Trash2 className="size-4 text-destructive" />
      </Button>
    </div>
  );
}

/** Create + manage product categories. */
function CategoryManager({ categories }: { categories: CategoryDTO[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [nameEn, setNameEn] = React.useState("");
  const [nameAr, setNameAr] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!nameEn.trim()) {
      toast.error(t("admin.categories.nameRequired"));
      return;
    }
    setBusy(true);
    try {
      await createCategory({
        nameEn: nameEn.trim(),
        nameAr: nameAr.trim(),
        sortOrder: categories.length,
        isActive: true,
      });
      toast.success(t("admin.categories.created"));
      setNameEn("");
      setNameAr("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("admin.products.error.create"));
    }
    setBusy(false);
  }

  return (
    <div className="mt-8 rounded-2xl border border-border/60 bg-card/40 p-5">
      <button
        type="button"
        className="flex w-full items-center justify-between text-start"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div>
          <h2 className="font-heading text-xl">{t("admin.categories.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("admin.categories.subtitle")}
          </p>
        </div>
        <span className="text-sm text-primary">
          {open ? t("admin.categories.hide") : t("admin.categories.manage")}
        </span>
      </button>

      {open && (
        <div className="mt-5 space-y-4">
          <form
            onSubmit={add}
            className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-border p-3"
          >
            <div className="space-y-1">
              <Label className="text-xs">{t("admin.categories.nameEn")}</Label>
              <Input
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder={t("admin.categories.namePlaceholder")}
                className="h-8 w-44"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("admin.categories.nameAr")}</Label>
              <Input
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                dir="rtl"
                className="h-8 w-44"
              />
            </div>
            <Button type="submit" size="sm" disabled={busy} className="rounded-xl">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {t("admin.categories.add")}
            </Button>
          </form>

          <div className="space-y-2">
            {categories.map((c) => (
              <CategoryRow key={c.id} cat={c} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type Props = {
  products: AdminProduct[];
  categories: CategoryDTO[];
  dbOffline?: boolean;
};

export function ProductsAdmin({ products, categories, dbOffline }: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [nameAr, setNameAr] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [descriptionAr, setDescriptionAr] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [oldPrice, setOldPrice] = React.useState("");
  const [sellByWeight, setSellByWeight] = React.useState(true);
  const [sizeRows, setSizeRows] = React.useState<SizeRow[]>(defaultSizeRows());
  const [imageUrl, setImageUrl] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [category, setCategory] = React.useState<string>(
    categories[0]?.key ?? "MUST_TRY"
  );
  const [isBestSeller, setIsBestSeller] = React.useState(false);
  const [isPromo, setIsPromo] = React.useState(false);
  const [isCustomizable, setIsCustomizable] = React.useState(false);
  const [isAvailable, setIsAvailable] = React.useState(true);
  const [isNew, setIsNew] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);

  // Table filters: free-text name (EN/AR) + category.
  const [filterName, setFilterName] = React.useState("");
  const [filterCategory, setFilterCategory] = React.useState("ALL");
  const visibleProducts = React.useMemo(() => {
    const q = filterName.trim().toLowerCase();
    return products.filter((p) => {
      if (filterCategory !== "ALL" && p.category !== filterCategory) {
        return false;
      }
      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !p.nameAr.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [products, filterName, filterCategory]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      let image = imageUrl.trim();
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        image = await uploadProductImage(fd);
      }
      if (!image) {
        toast.error(t("admin.products.error.noImage"));
        setBusy(false);
        return;
      }
      await createProduct({
        name: name.trim(),
        nameAr: nameAr.trim(),
        description: description.trim(),
        descriptionAr: descriptionAr.trim(),
        price: Number(price),
        oldPrice: oldPrice.trim() ? Number(oldPrice) : null,
        sellByWeight,
        weightOptions: sellByWeight ? rowsToWeightOptions(sizeRows) : null,
        image,
        category,
        isBestSeller,
        isPromo,
        isCustomizable,
        isAvailable,
        isNew,
      });
      toast.success(t("admin.products.toast.created"));
      router.refresh();
      setName("");
      setNameAr("");
      setDescription("");
      setDescriptionAr("");
      setPrice("");
      setOldPrice("");
      setSellByWeight(true);
      setSizeRows(defaultSizeRows());
      setImageUrl("");
      setFile(null);
      setIsBestSeller(false);
      setIsPromo(false);
      setIsCustomizable(false);
      setIsAvailable(true);
      setIsNew(false);
    } catch (err) {
      console.error(err);
      toast.error(t("admin.products.error.create"), {
        description: err instanceof Error ? err.message : undefined,
      });
    }
    setBusy(false);
  }

  async function onDelete(id: string) {
    if (!confirm(t("admin.products.confirm.delete"))) return;
    try {
      const res = await deleteProduct(id);
      if (!res.ok) {
        toast.error(res.error ?? t("admin.products.error.delete"));
        return;
      }
      toast.success(t("admin.products.toast.deleted"));
      router.refresh();
    } catch {
      toast.error(t("admin.products.error.delete"));
    }
  }

  async function patch(
    id: string,
    patch: Partial<{
      isBestSeller: boolean;
      isPromo: boolean;
      isCustomizable: boolean;
      isAvailable: boolean;
      isNew: boolean;
    }>
  ) {
    try {
      await updateProduct(id, patch);
      toast.success(t("admin.products.toast.updated"));
      router.refresh();
    } catch {
      toast.error(t("admin.products.error.update"));
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {dbOffline && (
        <p className="mb-6 rounded-xl border border-border bg-primary/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          {t("admin.products.dbOffline")}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl">{t("admin.products.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("admin.products.subtitle.before")}
            <code className="rounded bg-muted px-1">public/uploads</code>
            {t("admin.products.subtitle.after")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            className="rounded-xl"
            onClick={() => setShowForm((v) => !v)}
            aria-expanded={showForm}
          >
            {showForm ? (
              <>
                <X className="size-4" />
                {t("admin.products.formClose")}
              </>
            ) : (
              <>
                <Plus className="size-4" />
                {t("admin.products.formTitle")}
              </>
            )}
          </Button>
          <Link
            href="/admin"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {t("admin.products.ordersLink")}
          </Link>
        </div>
      </div>

      <CategoryManager categories={categories} />

      {showForm && (
      <form
        onSubmit={onCreate}
        className="mt-10 grid gap-4 rounded-2xl border border-border/60 bg-card/40 p-5 sm:grid-cols-2"
      >
        <div className="flex items-center justify-between gap-3 sm:col-span-2">
          <h2 className="font-heading text-xl">{t("admin.products.formTitle")}</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowForm(false)}
            aria-label={t("admin.products.formClose")}
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">{t("admin.products.label.name")}</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name-ar">{t("admin.products.label.nameAr")}</Label>
          <Input
            id="name-ar"
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="desc">{t("admin.products.label.description")}</Label>
          <Textarea
            id="desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="desc-ar">{t("admin.products.label.descriptionAr")}</Label>
          <Textarea
            id="desc-ar"
            rows={3}
            value={descriptionAr}
            onChange={(e) => setDescriptionAr(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">{t("admin.products.label.price")}</Label>
          <Input
            id="price"
            type="number"
            step="0.001"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
          <p className="text-[11px] leading-snug text-muted-foreground">
            {t("admin.products.priceHint")}
          </p>
        </div>
        <div className="space-y-3 rounded-xl border border-border/60 bg-card/40 p-3 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={sellByWeight}
              onCheckedChange={(v) => setSellByWeight(v === true)}
            />
            {t("admin.products.label.sellByWeight")}
          </label>
          {sellByWeight ? (
            <SizeRowsEditor rows={sizeRows} onChange={setSizeRows} idPrefix="new" />
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="old">{t("admin.products.label.oldPrice")}</Label>
          <Input
            id="old"
            type="number"
            step="0.001"
            min="0"
            value={oldPrice}
            onChange={(e) => setOldPrice(e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="img">{t("admin.products.label.imageUrl")}</Label>
          <Input
            id="img"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder={t("admin.products.placeholder.imageUrl")}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="file">{t("admin.products.label.upload")}</Label>
          <Input
            id="file"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("admin.products.label.category")}</Label>
          <Select
            value={category}
            onValueChange={(v) => {
              if (v) setCategory(v);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.key} value={c.key}>
                  {locale === "ar" && c.nameAr.trim() ? c.nameAr : c.nameEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-3 sm:justify-center">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={isBestSeller}
              onCheckedChange={(v) => setIsBestSeller(v === true)}
            />
            {t("admin.products.flag.bestSeller")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={isPromo}
              onCheckedChange={(v) => setIsPromo(v === true)}
            />
            {t("admin.products.flag.promo")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={isCustomizable}
              onCheckedChange={(v) => setIsCustomizable(v === true)}
            />
            {t("admin.products.flag.customizable")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={isAvailable}
              onCheckedChange={(v) => setIsAvailable(v === true)}
            />
            {t("admin.products.flag.available")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={isNew}
              onCheckedChange={(v) => setIsNew(v === true)}
            />
            {t("admin.products.flag.new")}
          </label>
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={busy} className="rounded-xl">
            {busy ? t("admin.products.submit.saving") : t("admin.products.submit.create")}
          </Button>
        </div>
      </form>
      )}
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_240px]">
        <Input
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          placeholder={t("admin.products.filter.name")}
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="h-9 w-full rounded-lg border border-border/60 bg-card px-2 text-sm"
        >
          <option value="ALL">{t("admin.products.filter.allCategories")}</option>
          {categories.map((c) => (
            <option key={c.key} value={c.key}>
              {locale === "ar" && c.nameAr.trim() ? c.nameAr : c.nameEn}
            </option>
          ))}
        </select>
      </div>


      <div className="mt-12 overflow-x-auto rounded-2xl border border-border/60 bg-card/40">
        <table className="w-full min-w-[720px] text-start text-sm">
          <thead className="border-b border-border/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3"> </th>
              <th className="px-4 py-3">{t("admin.products.th.name")}</th>
              <th className="px-4 py-3">{t("admin.products.th.category")}</th>
              <th className="px-4 py-3">{t("admin.products.th.price")}</th>
              <th className="px-4 py-3">{t("admin.products.th.flags")}</th>
              <th className="px-4 py-3"> </th>
            </tr>
          </thead>
          <tbody>
            {visibleProducts.map((p) => (
              <tr key={p.id} className="border-b border-border/40">
                <td className="px-4 py-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-muted">
                    <ProductThumb src={p.image} name={p.name} />
                  </div>
                </td>
                <td className="max-w-[220px] px-4 py-3">
                  <div className="truncate font-medium">{p.name}</div>
                  {p.nameAr ? (
                    <div className="truncate text-xs text-muted-foreground">
                      {p.nameAr}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {getCategoryLabel(p.category, locale, categories)}
                </td>
                <td className="px-4 py-3">
                  <EditablePrice id={p.id} price={Number(p.price)} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-xs">
                      <Checkbox
                        checked={p.isBestSeller}
                        onCheckedChange={(v) =>
                          patch(p.id, { isBestSeller: v === true })
                        }
                      />
                      {t("admin.products.flag.bestShort")}
                    </label>
                    <label className="flex items-center gap-2 text-xs">
                      <Checkbox
                        checked={p.isPromo}
                        onCheckedChange={(v) =>
                          patch(p.id, { isPromo: v === true })
                        }
                      />
                      {t("admin.products.flag.promoShort")}
                    </label>
                    <label className="flex items-center gap-2 text-xs">
                      <Checkbox
                        checked={p.isAvailable}
                        onCheckedChange={(v) =>
                          patch(p.id, { isAvailable: v === true })
                        }
                      />
                      {t("admin.products.flag.availableShort")}
                    </label>
                    <label className="flex items-center gap-2 text-xs">
                      <Checkbox
                        checked={p.isNew}
                        onCheckedChange={(v) => patch(p.id, { isNew: v === true })}
                      />
                      {t("admin.products.flag.newShort")}
                    </label>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-stretch gap-2">
                    <EditProductDialog product={p} categories={categories} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDelete(p.id)}
                    >
                      {t("admin.products.delete")}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
