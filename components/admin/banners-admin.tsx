"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { OfferBanner } from "@prisma/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useI18n } from "@/components/i18n/i18n-provider";
import { ImageDropField } from "@/components/admin/image-drop-field";
import {
  createOfferBanner,
  deleteOfferBanner,
  updateOfferBanner,
  uploadOfferBannerImage,
} from "@/actions/promo-banner-admin";

export type BannerAdminDTO = {
  id: string;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  imageUrl: string;
  linkUrl: string;
  sortOrder: number;
  enabled: boolean;
};

function toDto(b: OfferBanner): BannerAdminDTO {
  return {
    id: b.id,
    titleEn: b.titleEn,
    titleAr: b.titleAr,
    subtitleEn: b.subtitleEn,
    subtitleAr: b.subtitleAr,
    imageUrl: b.imageUrl,
    linkUrl: b.linkUrl,
    sortOrder: b.sortOrder,
    enabled: b.enabled,
  };
}

type Props = {
  banners: OfferBanner[];
  dbOffline: boolean;
};

function BannerRow({ row, dbOffline }: { row: BannerAdminDTO; dbOffline: boolean }) {
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
      await updateOfferBanner(row.id, {
        titleEn: draft.titleEn,
        titleAr: draft.titleAr,
        subtitleEn: draft.subtitleEn,
        subtitleAr: draft.subtitleAr,
        imageUrl: draft.imageUrl,
        linkUrl: draft.linkUrl,
        sortOrder: Number(draft.sortOrder),
        enabled: draft.enabled,
      });
      toast.success(t("admin.products.toast.updated"));
      router.refresh();
    } catch {
      toast.error(t("admin.products.error.update"));
    }
    setBusy(false);
  }

  async function remove() {
    if (!window.confirm(t("admin.banners.delete") + "?")) return;
    setBusy(true);
    try {
      await deleteOfferBanner(row.id);
      toast.success(t("admin.products.toast.deleted"));
      router.refresh();
    } catch {
      toast.error(t("admin.products.error.delete"));
    }
    setBusy(false);
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card/50 p-4">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1">
          <Label>{t("admin.banners.titleEn")}</Label>
          <Input
            value={draft.titleEn}
            onChange={(e) => setDraft((d) => ({ ...d, titleEn: e.target.value }))}
            className="border-border bg-card"
          />
        </div>
        <div className="space-y-1">
          <Label>{t("admin.banners.titleAr")}</Label>
          <Input
            value={draft.titleAr}
            onChange={(e) => setDraft((d) => ({ ...d, titleAr: e.target.value }))}
            className="border-border bg-card"
          />
        </div>
        <div className="space-y-1">
          <Label>{t("admin.banners.sort")}</Label>
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
          <Label>{t("admin.banners.subEn")}</Label>
          <Input
            value={draft.subtitleEn}
            onChange={(e) =>
              setDraft((d) => ({ ...d, subtitleEn: e.target.value }))
            }
            className="border-border bg-card"
          />
        </div>
        <div className="space-y-1">
          <Label>{t("admin.banners.subAr")}</Label>
          <Input
            value={draft.subtitleAr}
            onChange={(e) =>
              setDraft((d) => ({ ...d, subtitleAr: e.target.value }))
            }
            className="border-border bg-card"
          />
        </div>
        <div className="space-y-1 md:col-span-2 lg:col-span-3">
          <Label>{t("admin.banners.image")}</Label>
          <ImageDropField
            value={draft.imageUrl}
            onChange={(url) => setDraft((d) => ({ ...d, imageUrl: url }))}
            upload={uploadOfferBannerImage}
          />
        </div>
        <div className="space-y-1 md:col-span-2 lg:col-span-3">
          <Label>{t("admin.banners.link")}</Label>
          <Input
            value={draft.linkUrl}
            onChange={(e) =>
              setDraft((d) => ({ ...d, linkUrl: e.target.value }))
            }
            className="border-border bg-card"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={draft.enabled}
            onCheckedChange={(v) =>
              setDraft((d) => ({ ...d, enabled: Boolean(v) }))
            }
          />
          {t("admin.promos.enabled")}
        </label>
        <Button
          type="button"
          disabled={busy || dbOffline}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => void save()}
        >
          {t("admin.banners.save")}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy || dbOffline}
          onClick={() => void remove()}
        >
          {t("admin.banners.delete")}
        </Button>
      </div>
    </div>
  );
}

export function BannersAdmin({ banners, dbOffline }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const rows = banners.map(toDto);

  const [createDraft, setCreateDraft] = React.useState({
    titleEn: "",
    titleAr: "",
    subtitleEn: "",
    subtitleAr: "",
    imageUrl: "",
    linkUrl: "/menu",
    sortOrder: rows.length,
    enabled: true,
  });

  async function add() {
    setBusy(true);
    try {
      await createOfferBanner({
        titleEn: createDraft.titleEn || "Offer",
        titleAr: createDraft.titleAr || "عرض",
        subtitleEn: createDraft.subtitleEn,
        subtitleAr: createDraft.subtitleAr,
        imageUrl: createDraft.imageUrl,
        linkUrl: createDraft.linkUrl || "/menu",
        sortOrder: Number(createDraft.sortOrder),
        enabled: createDraft.enabled,
      });
      toast.success(t("admin.products.toast.created"));
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
      <div className="space-y-3">
        {rows.map((r) => (
          <BannerRow key={r.id} row={r} dbOffline={dbOffline} />
        ))}
      </div>
      <div className="rounded-xl border border-dashed border-border p-4">
        <p className="mb-3 text-sm font-medium text-primary/90">
          {t("admin.banners.add")}
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label>{t("admin.banners.titleEn")}</Label>
            <Input
              value={createDraft.titleEn}
              onChange={(e) =>
                setCreateDraft((d) => ({ ...d, titleEn: e.target.value }))
              }
              className="border-border bg-card"
            />
          </div>
          <div className="space-y-1">
            <Label>{t("admin.banners.titleAr")}</Label>
            <Input
              value={createDraft.titleAr}
              onChange={(e) =>
                setCreateDraft((d) => ({ ...d, titleAr: e.target.value }))
              }
              className="border-border bg-card"
            />
          </div>
          <div className="space-y-1">
            <Label>{t("admin.banners.subEn")}</Label>
            <Input
              value={createDraft.subtitleEn}
              onChange={(e) =>
                setCreateDraft((d) => ({ ...d, subtitleEn: e.target.value }))
              }
              className="border-border bg-card"
            />
          </div>
          <div className="space-y-1">
            <Label>{t("admin.banners.subAr")}</Label>
            <Input
              value={createDraft.subtitleAr}
              onChange={(e) =>
                setCreateDraft((d) => ({ ...d, subtitleAr: e.target.value }))
              }
              className="border-border bg-card"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>{t("admin.banners.image")}</Label>
            <ImageDropField
              value={createDraft.imageUrl}
              onChange={(url) =>
                setCreateDraft((d) => ({ ...d, imageUrl: url }))
              }
              upload={uploadOfferBannerImage}
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>{t("admin.banners.link")}</Label>
            <Input
              value={createDraft.linkUrl}
              onChange={(e) =>
                setCreateDraft((d) => ({ ...d, linkUrl: e.target.value }))
              }
              className="border-border bg-card"
            />
          </div>
        </div>
        <Button
          type="button"
          className="mt-3 bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={busy || dbOffline}
          onClick={() => void add()}
        >
          {t("admin.banners.add")}
        </Button>
      </div>
    </div>
  );
}
