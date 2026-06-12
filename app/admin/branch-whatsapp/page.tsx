import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminSession } from "@/actions/admin-auth";
import { getEditableBranchesWhatsapp } from "@/actions/branch-whatsapp-admin";
import { BranchWhatsappAdmin } from "@/components/admin/branch-whatsapp-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Branch WhatsApp" };

export default async function AdminBranchWhatsappPage() {
  if (!(await isAdminSession())) redirect("/admin/login");
  const branches = await getEditableBranchesWhatsapp();
  return <BranchWhatsappAdmin branches={branches} />;
}
