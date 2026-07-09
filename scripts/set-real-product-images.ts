/**
 * Point specific products at their real (official) photos.
 * - IMAGE_BY_NAME: always applied (fixes wrong/stock images).
 * - FILL_BY_NAME: applied only to products with no valid image.
 *
 *   npx tsx scripts/set-real-product-images.ts
 */
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

/** normalized product name -> image URL under /public (always applied) */
const IMAGE_BY_NAME: Record<string, string> = {
  "classic cheese kunafa": "/products/lebanese-kunafa-cheese.jpeg",
  "lebanese kunafa cheese": "/products/lebanese-kunafa-cheese.jpeg",
  "walnut maamoul": "/maamoul_walnut.png",
  "maamoul walnuts": "/maamoul_walnut.png",
  "pistachio ghraybe": "/kuwaiti%20grahy%20pistschio.png",
  "kuwaiti ghrayba pistachio": "/kuwaiti%20grahy%20pistschio.png",
  "mafrooke pistachio": "/products/mafrooke-pistachio.jpeg",
  "mafrooka pistacio": "/products/mafrooke-pistachio.jpeg",
  "mafrooke": "/mafrooke.jpg",
  "mafrooka": "/mafrooke.jpg",
  "royal baklava mix": "/products/baklawa-mix.jpeg",
  "baklawa mix": "/products/baklawa-mix.jpeg",
  "mixed baklawa": "/products/baklawa-mix.jpeg",
  "baloreye cashew": "/products/baloreye-cashew.jpeg",
  "burma cashew": "/products/burma-cashew.jpeg",
  "barazek": "/Barazek.png",
};

/** Applied only when the product has NO valid image. */
const FILL_BY_NAME: Record<string, string> = {
  "awamat": "/products/awamat.jpeg",
  "baklawa koul w shkour pistachio": "/products/baklawa-koul-w-shkour-pistachio.jpeg",
  "koul w shkour pistachio": "/products/baklawa-koul-w-shkour-pistachio.jpeg",
  "baklawa pistachio": "/products/baklawa-pistachio.jpeg",
  "baklawa sorar cashew": "/products/baklawa-sorar-cashew.jpeg",
  "baklawa sorar pistachio": "/products/baklawa-sorar-pistachio.jpeg",
  "balah sham": "/products/balah-sham.jpeg",
  "baloreye pistachio": "/products/baloreye-pistachio.jpeg",
  "barazek chocolate": "/products/barazek-chocolate.jpeg",
  "basma mix nuts": "/products/basma-mix-nuts.jpeg",
  "ghraybe": "/products/ghraybe.jpeg",
  "katayef kashta": "/products/katayef-kashta.jpeg",
  "katayef walnut": "/products/katayef-walnut.jpeg",
  "lawzeye": "/products/lawzeye.jpeg",
  "maamoul walnuts chocolate": "/products/maamoul-walnuts-chocolate.jpeg",
  "maamoul walnuts and chocolate": "/products/maamoul-walnuts-chocolate.jpeg",
  "maha eyes with chocolate": "/products/maha-eyes-with-chocolate.jpeg",
  "maha eyes chocolate": "/products/maha-eyes-with-chocolate.jpeg",
  "mini kunafa mix nuts": "/products/mini-kunafa-mix-nuts.jpeg",
  "namoora kashta": "/products/namoora-kashta.jpeg",
  "namoura kashta": "/products/namoora-kashta.jpeg",
  "osmalia kashta": "/products/osmalia-kashta.jpeg",
  "warbat kashta": "/products/warbat-kashta.jpeg",
  "znood al set": "/products/znood-al-set.jpeg",
};

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z ]+/g, " ").replace(/\s+/g, " ").trim();
}

/** True when the image is empty, external, or a local path whose file is missing. */
function hasNoValidImage(image: string | null | undefined): boolean {
  if (!image || !image.trim()) return true;
  if (!image.startsWith("/")) return true;
  const decoded = decodeURIComponent(image.slice(1));
  return !fs.existsSync(path.join(process.cwd(), "public", decoded));
}

async function main() {
  const products = await prisma.product.findMany();
  let updated = 0;

  for (const p of products) {
    const n = norm(p.name);
    let url = IMAGE_BY_NAME[n];
    if (!url && FILL_BY_NAME[n] && hasNoValidImage(p.image)) {
      url = FILL_BY_NAME[n];
    }
    if (!url || p.image === url) continue;
    await prisma.product.update({
      where: { id: p.id },
      data: { image: url, images: [url] },
    });
    console.log(`OK ${p.name} -> ${url}`);
    updated++;
  }

  console.log(`\nDone: ${updated} product image(s) updated.\n`);
}

main()
  .catch((e) => {
    console.error("Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
