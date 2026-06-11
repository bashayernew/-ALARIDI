"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminLogin } from "@/actions/admin-auth";
import { useI18n } from "@/components/i18n/i18n-provider";

export function LoginForm() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const ok = await adminLogin(email, password);
    setLoading(false);
    if (!ok) {
      setErr(t("admin.login.error"));
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16 sm:py-24">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        {t("admin.login.kicker")}
      </p>
      <h1 className="mt-2 font-heading text-3xl">{t("admin.login.title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("admin.login.subtitle.before")}{" "}
        <code className="rounded bg-muted px-1">ADMIN_EMAIL</code>{" "}
        {t("admin.login.subtitle.andWord")}{" "}
        <code className="rounded bg-muted px-1">ADMIN_PASSWORD</code>{" "}
        {t("admin.login.subtitle.after")}{" "}
        <code className="rounded bg-muted px-1">.env</code>.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("admin.login.email")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pw">{t("admin.login.password")}</Label>
          <Input
            id="pw"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <Button type="submit" className="w-full rounded-xl" disabled={loading}>
          {loading ? t("admin.login.submitting") : t("admin.login.submit")}
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link href="/" className="text-primary hover:underline">
          ← {t("admin.login.back")}
        </Link>
      </p>
    </div>
  );
}
