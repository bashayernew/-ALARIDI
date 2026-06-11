"use client";

import * as React from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (url: string) => void;
  /** Server action that uploads a file and returns its public URL. */
  upload: (formData: FormData) => Promise<string>;
  /** Optional aspect ratio for the preview box. Defaults to wide banner. */
  className?: string;
};

export function ImageDropField({ value, onChange, upload, className }: Props) {
  const { t } = useI18n();
  const [busy, setBusy] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFile(file: File | null | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("admin.imageDrop.notImage"));
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const url = await upload(fd);
      onChange(url);
      toast.success(t("admin.imageDrop.uploaded"));
    } catch {
      toast.error(t("admin.imageDrop.failed"));
    }
    setBusy(false);
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFile(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-border bg-card/40 p-4 text-center transition",
          "hover:border-primary/50 hover:bg-card/60",
          dragOver && "border-primary bg-primary/5",
          className
        )}
      >
        {value ? (
          <>
            <div className="relative h-32 w-full overflow-hidden rounded-lg">
              <Image
                src={value}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 480px"
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {t("admin.imageDrop.replace")}
            </span>
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="absolute right-2 top-2 inline-flex size-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow"
              aria-label={t("admin.imageDrop.remove")}
            >
              <X className="size-3.5" />
            </span>
          </>
        ) : (
          <>
            {busy ? (
              <Loader2 className="size-6 animate-spin text-primary" />
            ) : (
              <ImagePlus className="size-6 text-primary/70" />
            )}
            <span className="text-sm font-medium text-foreground">
              {t("admin.imageDrop.prompt")}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("admin.imageDrop.hint")}
            </span>
          </>
        )}
        {busy && value ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : null}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("admin.imageDrop.urlPlaceholder")}
        className="border-border bg-card text-xs"
      />
    </div>
  );
}
