"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/components/i18n/i18n-provider";
import { useCustomerAuth } from "@/components/auth/customer-auth-provider";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm() {
  const { t } = useI18n();
  const { login } = useCustomerAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next") ?? "/account";
  const nextPath =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/account";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errors, setErrors] = React.useState<{
    email?: string;
    password?: string;
    form?: string;
  }>({});
  const [loading, setLoading] = React.useState(false);

  function validate(): boolean {
    const e: typeof errors = {};
    const em = email.trim();
    if (!em) e.email = t("auth.error.required");
    else if (!EMAIL_RE.test(em)) e.email = t("auth.error.email");
    if (!password) e.password = t("auth.error.required");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setErrors({});
    if (!validate()) return;
    setLoading(true);
    const res = await login(email.trim(), password);
    setLoading(false);
    if (!res.ok) {
      const message =
        res.code === "service_unavailable"
          ? t("auth.error.serviceUnavailable")
          : t("auth.error.invalidCredentials");
      setErrors({ form: message });
      return;
    }
    router.push(nextPath);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
        {t("auth.login.kicker")}
      </p>
      <h1 className="mt-2 font-heading text-4xl">{t("auth.login.title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("auth.login.subtitle")}</p>

      <form onSubmit={onSubmit} className="mt-10 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="login-email">{t("auth.field.email")}</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cn(errors.email && "border-destructive")}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="login-password">{t("auth.field.password")}</Label>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={cn(errors.password && "border-destructive")}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password}</p>
          )}
        </div>
        {errors.form && (
          <p className="text-sm text-destructive">{errors.form}</p>
        )}
        <Button
          type="submit"
          className="w-full rounded-xl gold-glow"
          disabled={loading}
        >
          {loading ? t("auth.submit.loginLoading") : t("auth.submit.login")}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        {t("auth.link.noAccount")}{" "}
        <Link href="/register" className="text-primary hover:underline">
          {t("auth.link.toRegister")}
        </Link>
      </p>
      <p className="mt-4 text-center text-sm">
        <Link href="/" className="text-muted-foreground hover:text-primary">
          ← {t("auth.backHome")}
        </Link>
      </p>
    </div>
  );
}
