import type { Product } from "@prisma/client";
import type { GiftLineDelivery } from "@/lib/gift-delivery";

/** JSON-safe product for client components */
export type ProductDTO = {
  id: string;
  slug: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  ingredients: string;
  ingredientsAr: string;
  allergens: string[];
  price: number;
  oldPrice: number | null;
  sellByWeight?: boolean;
  price500g?: number | null;
  price1kg?: number | null;
  weightOptions?: { label: string; price: number }[] | null;
  image: string;
  images: string[];
  category: string;
  isBestSeller: boolean;
  isPromo: boolean;
  isCustomizable: boolean;
  isNew: boolean;
  stockQty: number | null;
};

export function parseWeightOptions(
  v: unknown
): { label: string; price: number }[] | null {
  if (!Array.isArray(v)) return null;
  const out: { label: string; price: number }[] = [];
  for (const x of v) {
    if (
      x &&
      typeof x === "object" &&
      typeof (x as { label?: unknown }).label === "string" &&
      typeof (x as { price?: unknown }).price === "number"
    ) {
      out.push({
        label: (x as { label: string }).label,
        price: (x as { price: number }).price,
      });
    }
  }
  return out.length > 0 ? out : null;
}

export function productToDTO(p: Product): ProductDTO {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    nameAr: p.nameAr,
    description: p.description,
    descriptionAr: p.descriptionAr,
    ingredients: p.ingredients,
    ingredientsAr: p.ingredientsAr,
    allergens: p.allergens,
    price: Number(p.price),
    oldPrice: p.oldPrice != null ? Number(p.oldPrice) : null,
    sellByWeight: p.sellByWeight,
    price500g: p.price500g != null ? Number(p.price500g) : null,
    price1kg: p.price1kg != null ? Number(p.price1kg) : null,
    weightOptions: parseWeightOptions(p.weightOptions),
    image: p.image,
    images: p.images.length > 0 ? p.images : [p.image],
    category: p.category,
    isBestSeller: p.isBestSeller,
    isPromo: p.isPromo,
    isCustomizable: p.isCustomizable,
    isNew: p.isNew,
    stockQty: p.stockQty,
  };
}

export type CartLineInput = {
  kind?: "product" | "gift_card" | "gift_basket";
  productId: string;
  giftCardProductId?: string;
  giftBasketId?: string;
  /** Selected gift card value (KWD) when buying a gift card product */
  unitPrice?: number;
  quantity: number;
  note?: string;
  giftWrap: boolean;
  cardMessage?: string;
  extraToppings: boolean;
  recipientName?: string;
  recipientEmail?: string;
  giftDelivery?: GiftLineDelivery;
};
