import { Suspense } from "react";
import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/dictionary";
import { AccountGuard } from "@/components/auth/account-guard";
import { AccountDashboard } from "@/components/account/account-dashboard";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: translate(locale, "account.meta.title") };
}

export default function AccountPage() {
  return (
    <Suspense fallback={null}>
      <AccountGuard>
        <AccountDashboard />
      </AccountGuard>
    </Suspense>
  );
}
