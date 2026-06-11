"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/components/i18n/i18n-provider";
import { useCustomerAuth } from "@/components/auth/customer-auth-provider";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterForm() {
  const { t } = useI18n();
  const { register } = useCustomerAuth();
  const router = useRouter();

  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [errors, setErrors] = React.useState<{
    fullName?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirm?: string;
    form?: string;
  }>({});
  const [loading, setLoading] = React.useState(false);

  function validate(): boolean {
    const e: typeof errors = {};
    if (!fullName.trim()) e.fullName = t("auth.error.required");
    const em = email.trim();
    if (!em) e.email = t("auth.error.required");
    else if (!EMAIL_RE.test(em)) e.email = t("auth.error.email");
    if (!phone.trim()) e.phone = t("auth.error.required");
    if (!password) e.password = t("auth.error.required");
    else if (password.length < 8) e.password = t("auth.error.passwordMin");
    if (!confirm) e.confirm = t("auth.error.required");
    else if (confirm !== password) e.confirm = t("auth.error.passwordMatch");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setErrors({});
    if (!validate()) return;
    setLoading(true);
    const res = await register({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
    });
    setLoading(false);
    if (!res.ok) {
      const message =
        res.code === "email_taken"
          ? t("auth.error.emailTaken")
          : res.code === "service_unavailable"
            ? t("auth.error.serviceUnavailable")
            : t("auth.error.invalidCredentials");
      setErrors({ form: message });
      return;
    }
    router.push("/account");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
        {t("auth.register.kicker")}
      </p>
      <h1 className="mt-2 font-heading text-4xl">{t("auth.register.title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("auth.register.subtitle")}
      </p>

      <form onSubmit={onSubmit} className="mt-10 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="reg-name">{t("auth.field.fullName")}</Label>
          <Input
            id="reg-name"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={cn(errors.fullName && "border-destructive")}
          />
          {errors.fullName && (
            <p className="text-sm text-destructive">{errors.fullName}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="reg-email">{t("auth.field.email")}</Label>
          <Input
            id="reg-email"
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
          <Label htmlFor="reg-phone">{t("auth.field.phone")}</Label>
          <Input
            id="reg-phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={cn(errors.phone && "border-destructive")}
          />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="reg-password">{t("auth.field.password")}</Label>
          <Input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={cn(errors.password && "border-destructive")}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="reg-confirm">{t("auth.field.confirmPassword")}</Label>
          <Input
            id="reg-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={cn(errors.confirm && "border-destructive")}
          />
          {errors.confirm && (
            <p className="text-sm text-destructive">{errors.confirm}</p>
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
          {loading ? t("auth.submit.registerLoading") : t("auth.submit.register")}
        </Button>
      </form>

      <p className="mt-6 rounded-xl border border-border/50 bg-card/30 px-4 py-3 text-xs text-muted-foreground">
        {t("auth.mockNotice")}
      </p>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        {t("auth.link.hasAccount")}{" "}
        <Link href="/login" className="text-primary hover:underline">
          {t("auth.link.toLogin")}
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
