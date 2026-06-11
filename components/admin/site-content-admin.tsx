"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/components/i18n/i18n-provider";
import { EDITABLE_SITE_KEYS } from "@/lib/editable-site-keys";
import type { TranslationKey } from "@/lib/dictionary";
import type { SiteContentOverrideMap } from "@/lib/site-content-types";
import type { SocialUrlKey } from "@/lib/site-content-types";
import { upsertSiteContent, deleteSiteContent } from "@/actions/cms-admin";

const SOCIAL_KEYS: SocialUrlKey[] = [
  "instagram",
  "tiktok",
  "snapchat",
  "whatsapp",
];

type Props = {
  initialMap: SiteContentOverrideMap;
  dbOffline: boolean;
};

function KeyEditor({
  dictKey,
  initialEn,
  initialAr,
  dbOffline,
}: {
  dictKey: TranslationKey;
  initialEn: string;
  initialAr: string;
  dbOffline: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [en, setEn] = React.useState(initialEn);
  const [ar, setAr] = React.useState(initialAr);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    setEn(initialEn);
    setAr(initialAr);
  }, [initialEn, initialAr]);

  async function save() {
    setBusy(true);
    try {
      if (!en.trim() && !ar.trim()) {
        await deleteSiteContent(dictKey);
        toast.success(t("admin.products.toast.deleted"));
      } else {
        await upsertSiteContent(dictKey, en, ar);
        toast.success(t("admin.products.toast.updated"));
      }
      router.refresh();
    } catch {
      toast.error(t("admin.products.error.update"));
    }
    setBusy(false);
  }

  return (
    <div className="rounded-xl border border-border bg-card/50 p-4">
      <p className="font-mono text-xs text-primary/80">{dictKey}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("admin.content.note")} — {t("nav.lang.en")}: {t(dictKey)}
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label>EN</Label>
          <Input
            value={en}
            onChange={(e) => setEn(e.target.value)}
            className="border-border bg-card"
            placeholder={t(dictKey)}
          />
        </div>
        <div className="space-y-1">
          <Label>AR</Label>
          <Input
            value={ar}
            onChange={(e) => setAr(e.target.value)}
            className="border-border bg-card"
            dir="rtl"
          />
        </div>
      </div>
      <Button
        type="button"
        className="mt-3 bg-primary text-primary-foreground hover:bg-primary/90"
        disabled={busy || dbOffline}
        onClick={() => void save()}
      >
        {t("admin.content.save")}
      </Button>
    </div>
  );
}

function SocialEditor({
  platform,
  initialUrl,
  dbOffline,
}: {
  platform: SocialUrlKey;
  initialUrl: string;
  dbOffline: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const key = `social.url.${platform}`;
  const [url, setUrl] = React.useState(initialUrl);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    setUrl(initialUrl);
  }, [initialUrl]);

  async function save() {
    setBusy(true);
    try {
      const u = url.trim();
      if (!u) {
        await deleteSiteContent(key);
        toast.success(t("admin.products.toast.deleted"));
      } else {
        await upsertSiteContent(key, u, u);
        toast.success(t("admin.products.toast.updated"));
      }
      router.refresh();
    } catch {
      toast.error(t("admin.products.error.update"));
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card/50 p-3 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1 space-y-1">
        <Label className="capitalize">{platform}</Label>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t("admin.content.placeholderUrl")}
          className="border-border bg-background"
        />
      </div>
      <Button
        type="button"
        variant="outline"
        className="border-border"
        disabled={busy || dbOffline}
        onClick={() => void save()}
      >
        {t("admin.content.save")}
      </Button>
    </div>
  );
}

export function SiteContentAdmin({ initialMap, dbOffline }: Props) {
  const { t } = useI18n();

  return (
    <div className="space-y-8">
      {dbOffline && (
        <p className="rounded-xl border border-border bg-primary/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          {t("admin.products.dbOffline")}
        </p>
      )}
      <p className="text-sm text-muted-foreground">{t("admin.content.note")}</p>
      <div className="space-y-4">
        {EDITABLE_SITE_KEYS.map((k) => {
          const row = initialMap[k];
          return (
            <KeyEditor
              key={k}
              dictKey={k}
              initialEn={row?.valueEn ?? ""}
              initialAr={row?.valueAr ?? ""}
              dbOffline={dbOffline}
            />
          );
        })}
      </div>
      <div>
        <h2 className="mb-3 font-heading text-xl text-primary">
          {t("admin.content.socialSection")}
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {SOCIAL_KEYS.map((p) => {
            const row = initialMap[`social.url.${p}`];
            const initial = (row?.valueEn || row?.valueAr || "").trim();
            return (
              <SocialEditor
                key={p}
                platform={p}
                initialUrl={initial}
                dbOffline={dbOffline}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
