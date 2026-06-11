"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { HeaderOffer, HeaderOfferPlacement } from "@prisma/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { TranslationKey } from "@/lib/dictionary";
import { HEADER_OFFER_ICON_OPTIONS } from "@/lib/header-offer-icons";
import {
  createHeaderOffer,
  deleteHeaderOffer,
  updateHeaderOffer,
  uploadHeaderOfferImage,
  type HeaderOfferAdminInput,
} from "@/actions/header-offers-admin";

const PLACEMENTS: HeaderOfferPlacement[] = [
  "TOP_ANNOUNCEMENT",
  "HERO_BADGE",
  "FEATURE_STRIP",
];

function toIso(d: Date | null): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export type HeaderOfferAdminDTO = {
  id: string;
  titleEn: string;
  titleAr: string;
  shortTextEn: string;
  shortTextAr: string;
  icon: string;
  image: string;
  ctaTextEn: string;
  ctaTextAr: string;
  ctaLink: string;
  placement: HeaderOfferPlacement;
  sortOrder: number;
  enabled: boolean;
  startsAt: string;
  expiresAt: string;
};

function toDto(row: HeaderOffer): HeaderOfferAdminDTO {
  return {
    id: row.id,
    titleEn: row.titleEn,
    titleAr: row.titleAr,
    shortTextEn: row.shortTextEn,
    shortTextAr: row.shortTextAr,
    icon: row.icon,
    image: row.image ?? "",
    ctaTextEn: row.ctaTextEn,
    ctaTextAr: row.ctaTextAr,
    ctaLink: row.ctaLink,
    placement: row.placement,
    sortOrder: row.sortOrder,
    enabled: row.enabled,
    startsAt: toIso(row.startsAt),
    expiresAt: toIso(row.expiresAt),
  };
}

function toInput(d: HeaderOfferAdminDTO): HeaderOfferAdminInput {
  return {
    titleEn: d.titleEn,
    titleAr: d.titleAr,
    shortTextEn: d.shortTextEn,
    shortTextAr: d.shortTextAr,
    icon: d.icon,
    image: d.image,
    ctaTextEn: d.ctaTextEn,
    ctaTextAr: d.ctaTextAr,
    ctaLink: d.ctaLink,
    placement: d.placement,
    sortOrder: Number(d.sortOrder),
    enabled: d.enabled,
    startsAt: d.startsAt || null,
    expiresAt: d.expiresAt || null,
  };
}

type Props = {
  offers: HeaderOffer[];
  dbOffline: boolean;
};

function PlacementSelect({
  value,
  onChange,
}: {
  value: HeaderOfferPlacement;
  onChange: (v: HeaderOfferPlacement) => void;
}) {
  const { t } = useI18n();
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as HeaderOfferPlacement)}
      className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground"
    >
      {PLACEMENTS.map((p) => (
        <option key={p} value={p}>
          {t(`admin.headerOffers.placement.${p}` as TranslationKey)}
        </option>
      ))}
    </select>
  );
}

function OfferFields({
  draft,
  setDraft,
}: {
  draft: HeaderOfferAdminDTO;
  setDraft: React.Dispatch<React.SetStateAction<HeaderOfferAdminDTO>>;
}) {
  const { t } = useI18n();
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      <div className="space-y-1">
        <Label>{t("admin.headerOffers.titleEn")}</Label>
        <Input
          value={draft.titleEn}
          onChange={(e) => setDraft((d) => ({ ...d, titleEn: e.target.value }))}
          className="border-border bg-card"
        />
      </div>
      <div className="space-y-1">
        <Label>{t("admin.headerOffers.titleAr")}</Label>
        <Input
          value={draft.titleAr}
          onChange={(e) => setDraft((d) => ({ ...d, titleAr: e.target.value }))}
          className="border-border bg-card"
          dir="rtl"
        />
      </div>
      <div className="space-y-1">
        <Label>{t("admin.headerOffers.shortEn")}</Label>
        <Input
          value={draft.shortTextEn}
          onChange={(e) =>
            setDraft((d) => ({ ...d, shortTextEn: e.target.value }))
          }
          className="border-border bg-card"
        />
      </div>
      <div className="space-y-1">
        <Label>{t("admin.headerOffers.shortAr")}</Label>
        <Input
          value={draft.shortTextAr}
          onChange={(e) =>
            setDraft((d) => ({ ...d, shortTextAr: e.target.value }))
          }
          className="border-border bg-card"
          dir="rtl"
        />
      </div>
      <div className="space-y-1">
        <Label>{t("admin.headerOffers.icon")}</Label>
        <select
          value={draft.icon}
          onChange={(e) => setDraft((d) => ({ ...d, icon: e.target.value }))}
          className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm"
        >
          {HEADER_OFFER_ICON_OPTIONS.map((ic) => (
            <option key={ic} value={ic}>
              {ic}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label>{t("admin.headerOffers.placement")}</Label>
        <PlacementSelect
          value={draft.placement}
          onChange={(placement) => setDraft((d) => ({ ...d, placement }))}
        />
      </div>
      <div className="space-y-1">
        <Label>{t("admin.headerOffers.imageUrl")}</Label>
        <Input
          value={draft.image}
          onChange={(e) => setDraft((d) => ({ ...d, image: e.target.value }))}
          className="border-border bg-card"
          placeholder="/uploads/… or https://…"
        />
      </div>
      <div className="space-y-1">
        <Label>{t("admin.products.label.upload")}</Label>
        <Input
          type="file"
          accept="image/*"
          className="border-border bg-card"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const fd = new FormData();
            fd.append("file", f);
            try {
              const url = await uploadHeaderOfferImage(fd);
              setDraft((d) => ({ ...d, image: url }));
              toast.success(t("admin.products.toast.updated"));
            } catch {
              toast.error(t("admin.products.error.create"));
            }
          }}
        />
      </div>
      {draft.image ? (
        <div className="space-y-1">
          <Label>{t("admin.headerOffers.preview")}</Label>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={draft.image}
            alt=""
            className="h-12 w-12 rounded-md border border-border object-cover"
          />
        </div>
      ) : null}
      <div className="space-y-1">
        <Label>{t("admin.headerOffers.ctaEn")}</Label>
        <Input
          value={draft.ctaTextEn}
          onChange={(e) =>
            setDraft((d) => ({ ...d, ctaTextEn: e.target.value }))
          }
          className="border-border bg-card"
        />
      </div>
      <div className="space-y-1">
        <Label>{t("admin.headerOffers.ctaAr")}</Label>
        <Input
          value={draft.ctaTextAr}
          onChange={(e) =>
            setDraft((d) => ({ ...d, ctaTextAr: e.target.value }))
          }
          className="border-border bg-card"
          dir="rtl"
        />
      </div>
      <div className="space-y-1 md:col-span-2">
        <Label>{t("admin.headerOffers.ctaLink")}</Label>
        <Input
          value={draft.ctaLink}
          onChange={(e) => setDraft((d) => ({ ...d, ctaLink: e.target.value }))}
          className="border-border bg-card"
          placeholder="/menu"
        />
      </div>
      <div className="space-y-1">
        <Label>{t("admin.headerOffers.sort")}</Label>
        <Input
          type="number"
          value={draft.sortOrder}
          onChange={(e) =>
            setDraft((d) => ({ ...d, sortOrder: Number(e.target.value) }))
          }
          className="border-border bg-card"
        />
      </div>
      <div className="space-y-1">
        <Label>{t("admin.headerOffers.starts")}</Label>
        <Input
          type="datetime-local"
          value={draft.startsAt}
          onChange={(e) => setDraft((d) => ({ ...d, startsAt: e.target.value }))}
          className="border-border bg-card"
        />
      </div>
      <div className="space-y-1">
        <Label>{t("admin.headerOffers.expires")}</Label>
        <Input
          type="datetime-local"
          value={draft.expiresAt}
          onChange={(e) =>
            setDraft((d) => ({ ...d, expiresAt: e.target.value }))
          }
          className="border-border bg-card"
        />
      </div>
    </div>
  );
}

function OfferRow({
  row,
  dbOffline,
}: {
  row: HeaderOfferAdminDTO;
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
      await updateHeaderOffer(row.id, toInput(draft));
      toast.success(t("admin.products.toast.updated"));
      router.refresh();
    } catch {
      toast.error(t("admin.products.error.update"));
    }
    setBusy(false);
  }

  async function remove() {
    if (!window.confirm(t("admin.headerOffers.delete") + "?")) return;
    setBusy(true);
    try {
      await deleteHeaderOffer(row.id);
      toast.success(t("admin.products.toast.deleted"));
      router.refresh();
    } catch {
      toast.error(t("admin.products.error.delete"));
    }
    setBusy(false);
  }

  async function toggleEnabled(next: boolean) {
    setDraft((d) => ({ ...d, enabled: next }));
    setBusy(true);
    try {
      await updateHeaderOffer(row.id, { enabled: next });
      toast.success(t("admin.products.toast.updated"));
      router.refresh();
    } catch {
      toast.error(t("admin.products.error.update"));
      setDraft((d) => ({ ...d, enabled: row.enabled }));
    }
    setBusy(false);
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card/50 p-4">
      <OfferFields draft={draft} setDraft={setDraft} />
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={draft.enabled}
            onCheckedChange={(v) => void toggleEnabled(Boolean(v))}
            disabled={busy || dbOffline}
          />
          {t("admin.promos.enabled")}
        </label>
        <Button
          type="button"
          disabled={busy || dbOffline}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => void save()}
        >
          {t("admin.headerOffers.save")}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy || dbOffline}
          onClick={() => void remove()}
        >
          {t("admin.headerOffers.delete")}
        </Button>
      </div>
    </div>
  );
}

export function HeaderOffersAdmin({ offers, dbOffline }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [showCreate, setShowCreate] = React.useState(false);
  const rows = offers.map(toDto);

  const [createDraft, setCreateDraft] = React.useState<HeaderOfferAdminDTO>({
    id: "",
    titleEn: "",
    titleAr: "",
    shortTextEn: "",
    shortTextAr: "",
    icon: "sparkles",
    image: "",
    ctaTextEn: "",
    ctaTextAr: "",
    ctaLink: "/menu",
    placement: "FEATURE_STRIP",
    sortOrder: rows.length,
    enabled: true,
    startsAt: "",
    expiresAt: "",
  });

  async function add() {
    setBusy(true);
    try {
      await createHeaderOffer(toInput(createDraft));
      toast.success(t("admin.products.toast.created"));
      setShowCreate(false);
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
      <Button
        type="button"
        className="bg-primary text-primary-foreground hover:bg-primary/90"
        disabled={dbOffline}
        onClick={() => setShowCreate((v) => !v)}
      >
        {showCreate
          ? t("admin.headerOffers.close")
          : `+ ${t("admin.headerOffers.add")}`}
      </Button>

      {showCreate ? (
        <div className="rounded-xl border border-dashed border-border p-4">
          <p className="mb-3 text-sm font-medium text-primary/90">
            {t("admin.headerOffers.add")}
          </p>
          <OfferFields draft={createDraft} setDraft={setCreateDraft} />
          <label className="mt-3 flex items-center gap-2 text-sm">
            <Checkbox
              checked={createDraft.enabled}
              onCheckedChange={(v) =>
                setCreateDraft((d) => ({ ...d, enabled: Boolean(v) }))
              }
            />
            {t("admin.promos.enabled")}
          </label>
          <Button
            type="button"
            className="mt-3 bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={busy || dbOffline}
            onClick={() => void add()}
          >
            {t("admin.headerOffers.add")}
          </Button>
        </div>
      ) : null}

      <p className="text-sm text-muted-foreground">{t("admin.headerOffers.note")}</p>
      <div className="space-y-3">
        {rows.map((r) => (
          <OfferRow key={r.id} row={r} dbOffline={dbOffline} />
        ))}
      </div>
    </div>
  );
}
