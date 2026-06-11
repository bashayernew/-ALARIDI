import { prisma } from "@/lib/prisma";
import { dbQueryWithFlag } from "@/lib/db-safe";
import { branchScopedOrGlobal } from "@/lib/branch-scope";
import type { OfferBanner, SiteContent } from "@prisma/client";
import type { SiteContentOverrideMap } from "@/lib/site-content-types";

export type { SiteContentOverrideMap } from "@/lib/site-content-types";

export async function fetchSiteContentMap(): Promise<SiteContentOverrideMap> {
  const { data } = await dbQueryWithFlag(
    [] as SiteContent[],
    () => prisma.siteContent.findMany()
  );
  const map: SiteContentOverrideMap = {};
  for (const row of data) {
    map[row.key] = { valueEn: row.valueEn, valueAr: row.valueAr };
  }
  return map;
}

export async function fetchEnabledOfferBanners(
  storefrontBranchId?: string | null
): Promise<OfferBanner[]> {
  const branchFilter = storefrontBranchId
    ? branchScopedOrGlobal(storefrontBranchId)
    : {};
  const { data } = await dbQueryWithFlag(
    [] as OfferBanner[],
    () =>
      prisma.offerBanner.findMany({
        where: { enabled: true, ...branchFilter },
        orderBy: { sortOrder: "asc" },
      })
  );
  return data;
}
