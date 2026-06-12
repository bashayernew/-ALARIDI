/**
 * Point products at real local images in /public. Many products were seeded with
 * external stock-photo URLs that don't load; this matches each product to the
 * closest image file by name (e.g. "Namoura" -> /Namoura.png), falling back to a
 * category image. Products that already use a valid local image are left alone.
 *
 *   npx tsx scripts/fix-product-images.ts   (or: npm run db:fix-product-images)
 */
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
const PUBLIC = path.join(process.cwd(), "public");

/** Build a public URL from a filename, encoding spaces etc. */
function publicUrl(filename: string): string {
  return "/" + encodeURIComponent(filename);
}

const STOP = new Set([
  "the", "and", "with", "of", "a", "box", "cup", "jar", "plate", "tray",
  "pieces", "selection", "250g", "1kg", "kg",
]);

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((t) => t.length >= 3 && !STOP.has(t));
}

const CATEGORY_DEFAULT: Record<string, string> = {
  MUST_TRY: "kunafa.jpg",
  PROMO: "mixedbaklawa.jpg",
  KUNAFA: "kunafa.jpg",
  BAKERY: "saj.jpg",
  BAKLAVA: "baklawa.jpg",
  BASMAH: "basmah_cashew.png",
  MAAMOUL: "maamoul.jpg",
  GHRAYBE: "kuwaiti ghrayba.png",
  KASHTA_SWEETS: "assorted.jpg",
  ASSORTED_SWEETS: "assorted.jpg",
  DIET_SWEETS: "assorted.jpg",
  LEBANESE_MOONE: "green_olives.png",
};

async function main() {
  const files = fs
    .readdirSync(PUBLIC)
    .filter((f) => /\.(jpe?g|png)$/i.test(f) && !/^\d+card\./i.test(f));
  const indexed = files.map((f) => ({ file: f, toks: tokens(f) }));

  const products = await prisma.product.findMany();
  let fixed = 0;
  let kept = 0;

  for (const p of products) {
    const img = p.image || "";
    if (img.startsWith("/")) {
      const decoded = decodeURIComponent(img.slice(1));
      if (fs.existsSync(path.join(PUBLIC, decoded))) {
        kept++;
        continue; // already a valid local image
      }
    }

    const ptoks = tokens(p.name);
    let best: string | null = null;
    let bestScore = 0;
    for (const cand of indexed) {
      const score = cand.toks.filter((t) => ptoks.includes(t)).length;
      if (score > bestScore) {
        bestScore = score;
        best = cand.file;
      }
    }

    const chosenFile =
      best && bestScore >= 1 ? best : CATEGORY_DEFAULT[p.category];
    const url = publicUrl(chosenFile);
    await prisma.product.update({
      where: { id: p.id },
      data: { image: url, images: [url] },
    });
    fixed++;
  }

  console.log(
    `\n✅ Product images updated: ${fixed} repointed to local images, ${kept} already local.\n` +
      `   Fine-tune any wrong matches in Admin → Products (upload or change the image).\n`
  );
}

main()
  .catch((e) => {
    console.error("\n❌ Failed to fix product images:\n", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
