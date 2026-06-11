"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { subscribeNewsletter } from "@/actions/newsletter";

type Props = {
  variant?: "card" | "inline";
};

export function NewsletterSignup({ variant = "card" }: Props) {
  const { t, locale } = useI18n();
  const [email, setEmail] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setPending(true);
    const res = await subscribeNewsletter({ email, locale });
    setPending(false);
    if (!res.ok) {
      toast.error(
        res.error === "validation"
          ? t("newsletter.error.validation")
          : t("newsletter.error.serviceUnavailable")
      );
      return;
    }
    toast.success(
      res.alreadySubscribed
        ? t("newsletter.alreadySubscribed")
        : t("newsletter.success")
    );
    setEmail("");
  }

  if (variant === "inline") {
    return (
      <form onSubmit={onSubmit} className="flex w-full flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("home.newsletter.placeholder")}
          className="h-11 flex-1 rounded-xl border border-border/60 bg-background px-4 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          {t("home.newsletter.subscribe")}
        </button>
      </form>
    );
  }

  return (
    <div className="rounded-3xl border border-primary/30 bg-secondary/30 p-6 text-center sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
        {t("home.newsletter.kicker")}
      </p>
      <h3 className="mt-2 font-heading text-3xl">{t("home.newsletter.title")}</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("home.newsletter.body")}
      </p>
      <form
        onSubmit={onSubmit}
        className="mt-4 flex flex-col gap-2 sm:flex-row"
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("home.newsletter.placeholder")}
          className="h-11 flex-1 rounded-xl border border-border/60 bg-background px-4 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          {t("home.newsletter.subscribe")}
        </button>
      </form>
    </div>
  );
}
