import {
  getHouseFavoriteProducts,
  getFreshTodayProducts,
  getPromoProducts,
  getMooneProducts,
} from "@/lib/data";
import { HomeSections } from "@/components/home/home-sections";
import { fetchEnabledOfferBanners } from "@/lib/site-content";
import { getActiveCategories } from "@/lib/category-data";
import { resolveStorefrontBranchId } from "@/lib/order-branch";

export async function HomePageInner() {
  const storefrontBranchId = await resolveStorefrontBranchId();
  const [
    houseFavorites,
    freshToday,
    promoProducts,
    mooneProducts,
    offerBanners,
    categories,
  ] = await Promise.all([
    getHouseFavoriteProducts(),
    getFreshTodayProducts(6),
    getPromoProducts(),
    getMooneProducts(),
    fetchEnabledOfferBanners(storefrontBranchId),
    getActiveCategories(),
  ]);

  return (
    <HomeSections
      houseFavorites={houseFavorites}
      freshToday={freshToday}
      promoProducts={promoProducts}
      mooneProducts={mooneProducts}
      offerBanners={offerBanners}
      categories={categories}
    />
  );
}
