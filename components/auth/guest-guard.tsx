"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCustomerAuth } from "@/components/auth/customer-auth-provider";

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const { user, ready } = useCustomerAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next") ?? "/account";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/account";

  React.useEffect(() => {
    if (!ready) return;
    if (user) {
      router.replace(next);
    }
  }, [ready, user, router, next]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-sm px-4 py-24">
        <div className="h-10 animate-pulse rounded-lg bg-muted/40" />
      </div>
    );
  }

  if (user) return null;

  return <>{children}</>;
}
