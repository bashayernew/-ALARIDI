import type { MenuProduct } from "@/lib/menu-data";
import type { ProductDTO } from "@/types";

/** Maps catalog menu items to the cart / modal product shape (real Product ids). */
export function menuProductToDTO(p: MenuProduct): ProductDTO {
  const hasDiscount = p.oldPrice != null && p.oldPrice > p.price;
  const category =
    "category" in p && p.category ? (p.category as string) : "MUST_TRY";
  return {
    id: p.id,
    slug: p.slug ?? p.id,
    name: p.name,
    nameAr: "",
    description: p.description,
    descriptionAr: "",
    ingredients: "",
    ingredientsAr: "",
    allergens: [],
    price: p.price,
    oldPrice: p.oldPrice ?? null,
    image: p.image,
    images: [p.image],
    category,
    isBestSeller: !!p.bestSeller,
    isPromo: !!(p.promo || hasDiscount),
    isCustomizable: !!p.customizable,
    isNew: !!p.isNew,
    stockQty: null,
  };
}
