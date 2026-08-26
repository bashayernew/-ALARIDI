"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/i18n-provider";
import { useCustomerAuth } from "@/components/auth/customer-auth-provider";

export function CheckoutConfirmationClient() {
  const { t } = useI18n();
  const { user, ready } = useCustomerAuth();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const isGuest = searchParams.get("guest") === "1";
  const offline = searchParams.get("offline") === "1";
  const payment = searchParams.get("payment"); // "success" | "failed" | null

  if (!orderId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-muted-foreground">{t("checkout.confirm.missing")}</p>
        <Link href="/menu" className={cn(buttonVariants(), "mt-6 inline-flex")}>
          {t("checkout.browseMenu")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:py-24">
      <div className="rounded-3xl border border-primary/30 bg-card/50 p-8 text-center">
        <CheckCircle2 className="mx-auto size-14 text-primary" aria-hidden />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          {t("checkout.confirm.kicker")}
        </p>
        <h1 className="mt-3 font-heading text-3xl">{t("checkout.confirm.title")}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {t("checkout.confirm.body")}
        </p>
        <p className="mt-6 font-mono text-sm text-foreground">
          {t("checkout.confirm.orderIdLabel")}{" "}
          <span className="text-primary">{orderId}</span>
        </p>
        {offline && (
          <p className="mt-4 text-xs text-primary/90">
            {t("checkout.confirm.offlineNote")}
          </p>
        )}
        {payment === "success" && (
          <p className="mt-4 rounded-xl bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-300">
            {t("checkout.confirm.paymentSuccess")}
          </p>
        )}
        {payment === "failed" && (
          <p className="mt-4 rounded-xl bg-destructive/15 px-4 py-2 text-sm font-medium text-destructive">
            {t("checkout.confirm.paymentFailed")}
          </p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/orders/${orderId}`}
            className={cn(buttonVariants(), "rounded-xl")}
          >
            {t("checkout.confirm.trackOrder")}
          </Link>
          <Link
            href="/menu"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "rounded-xl border-primary/40"
            )}
          >
            {t("checkout.confirm.backMenu")}
          </Link>
          {ready && user && !isGuest && (
            <Link
              href="/account"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "rounded-xl border-primary/40"
              )}
            >
              {t("checkout.confirm.viewAccount")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
