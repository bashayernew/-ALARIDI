import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import { fetchSiteContentMap } from "@/lib/site-content";
import { mergeFeatureFlagsFromContent } from "@/lib/site-content-types";
import { FeatureFlagsAdmin } from "@/components/admin/feature-flags-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Store features" };

export default async function AdminFeaturesPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (session.role !== "SUPER_ADMIN") redirect("/admin");

  const flags = mergeFeatureFlagsFromContent(await fetchSiteContentMap());

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-heading text-3xl text-foreground">Store features</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Turn whole sections of the store on or off. Disabled features are
        removed from the website entirely, including their pages and links.
      </p>
      <div className="mt-8">
        <FeatureFlagsAdmin initial={flags} />
      </div>
    </div>
  );
}
