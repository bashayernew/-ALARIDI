"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useCustomerAuth } from "@/components/auth/customer-auth-provider";

export function AccountGuard({ children }: { children: React.ReactNode }) {
  const { user, ready } = useCustomerAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent("/account")}`);
    }
  }, [ready, user, router]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-24 sm:px-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted/40" />
        <div className="h-32 animate-pulse rounded-2xl bg-muted/30" />
        <div className="h-32 animate-pulse rounded-2xl bg-muted/30" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
