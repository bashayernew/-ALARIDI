import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "@/lib/i18n-server";
import { getProductBySlug, getRelatedProducts } from "@/lib/data";
import { ProductDetail } from "@/components/product/product-detail";
import { isInWishlist } from "@/actions/wishlist";

export const dynamic = "force-dynamic";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return { title: "Product not found" };
  }
  const locale = await getLocale();
  const name = locale === "ar" && product.nameAr ? product.nameAr : product.name;
  const description =
    locale === "ar" && product.descriptionAr
      ? product.descriptionAr
      : product.description;
  return {
    title: name,
    description,
    openGraph: {
      title: name,
      description,
      images: product.images.length ? [{ url: product.images[0]! }] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, inWishlist] = await Promise.all([
    getRelatedProducts(product.id, product.category),
    isInWishlist(product.id),
  ]);

  return (
    <ProductDetail
      product={product}
      related={related}
      initialInWishlist={inWishlist}
    />
  );
}
