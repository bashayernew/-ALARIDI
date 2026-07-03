"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      className="flex gap-1 rounded-lg border border-primary/25 bg-secondary/30 p-0.5"
      role="group"
      aria-label="Language"
    >
      <Button
        type="button"
        variant={locale === "en" ? "default" : "ghost"}
        size="sm"
        className={cn(
          "h-11 min-w-11 px-2.5 text-xs font-semibold",
          locale !== "en" && "text-muted-foreground"
        )}
        onClick={() => setLocale("en")}
      >
        {t("nav.lang.en")}
      </Button>
      <Button
        type="button"
        variant={locale === "ar" ? "default" : "ghost"}
        size="sm"
        className={cn(
          "h-11 min-w-11 px-2.5 text-xs font-semibold",
          locale !== "ar" && "text-muted-foreground"
        )}
        onClick={() => setLocale("ar")}
      >
        {t("nav.lang.ar")}
      </Button>
    </div>
  );
}
