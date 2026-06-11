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
  image: string;
  images: string[];
  category: string;
  isBestSeller: boolean;
  isPromo: boolean;
  isCustomizable: boolean;
  isNew: boolean;
  stockQty: number | null;
};

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
