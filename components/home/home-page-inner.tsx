import {
  getHouseFavoriteProducts,
  getFreshTodayProducts,
  getPromoProducts,
  getMooneProducts,
  getAllProducts,
} from "@/lib/data";
import { HomeSections } from "@/components/home/home-sections";
import { fetchEnabledOfferBanners } from "@/lib/site-content";
import { resolveStorefrontBranchId } from "@/lib/order-branch";

export async function HomePageInner() {
  const storefrontBranchId = await resolveStorefrontBranchId();
  const [
    houseFavorites,
    freshToday,
    promoProducts,
    mooneProducts,
    allProducts,
    offerBanners,
  ] = await Promise.all([
    getHouseFavoriteProducts(),
    getFreshTodayProducts(6),
    getPromoProducts(),
    getMooneProducts(),
    getAllProducts(),
    fetchEnabledOfferBanners(storefrontBranchId),
  ]);
  const newArrivals = allProducts.slice(0, 8);

  return (
    <HomeSections
      houseFavorites={houseFavorites}
      freshToday={freshToday}
      promoProducts={promoProducts}
      mooneProducts={mooneProducts}
      newArrivals={newArrivals}
      offerBanners={offerBanners}
    />
  );
}
