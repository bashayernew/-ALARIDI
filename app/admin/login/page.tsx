import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminSession } from "@/actions/admin-auth";
import { LoginForm } from "@/components/admin/login-form";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: translate(locale, "admin.login.meta") };
}

export default async function AdminLoginPage() {
  if (await isAdminSession()) redirect("/admin");
  return <LoginForm />;
}
