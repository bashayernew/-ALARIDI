import { Suspense } from "react";
import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/dictionary";
import { GuestGuard } from "@/components/auth/guest-guard";
import { LoginForm } from "@/components/auth/login-form";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: translate(locale, "auth.login.metaTitle") };
}

function AuthFallback() {
  return (
    <div className="mx-auto max-w-md px-4 py-24">
      <div className="h-10 animate-pulse rounded-lg bg-muted/40" />
      <div className="mt-6 h-12 animate-pulse rounded-lg bg-muted/30" />
      <div className="mt-4 h-12 animate-pulse rounded-lg bg-muted/30" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <GuestGuard>
        <LoginForm />
      </GuestGuard>
    </Suspense>
  );
}
