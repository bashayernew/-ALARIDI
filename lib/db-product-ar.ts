import type { Locale } from "@/lib/i18n";
import type { ProductDTO } from "@/types";

/** Arabic copy keyed by exact English product name (matches Prisma seed) */
const BY_NAME: Record<string, { name: string; description: string }> = {
  "Signature Pistachio Kunafa": {
    name: "كنافة فستق مميزة",
    description:
      "كنافة مقرمشة، قشطة فاخرة، فستق محموس — مفضلة الدار.",
  },
  "Warbat Assorted Tray": {
    name: "صينية واربات مشكلة",
    description: "طبقات عجين مقرمش مع قشطة وقطر خفيف — جاهز للهدايا.",
  },
  "Classic Cheese Kunafa": {
    name: "كنافة جبن كلاسيك",
    description: "سحبة ذهبية، قلب جبن حلو، قطر زهر البرتقال.",
  },
  "Chocolate Kunafa Roll": {
    name: "رول كنافة شوكولاتة",
    description: "شوكولاتة داكنة ومكسرات مجروشة — يُفضّل ساخناً.",
  },
  "Maamoul Date Selection": {
    name: "تشكيلة معمول تمر",
    description: "أغلفة سميد بحشوة تمر مطهوة ببطء.",
  },
  "Kaak Sesame Rings": {
    name: "كعك السمسم",
    description: "مخبوزات لبنانية خفيفة — مثالية مع الشاي.",
  },
  "Royal Baklava Mix": {
    name: "خلطة بقلاوة ملكية",
    description: "فستق وكاجو وسمنة وقطر معتدل.",
  },
  "Bourek Ashta": {
    name: "بوريك قشطة",
    description: "سيجار عجين هشّ محشو قشطة معطّرة.",
  },
  "Walnut Maamoul": {
    name: "معمول جوز",
    description: "جوز محمّص وزهر البرتقال وغبار سكر لطيف.",
  },
  "Pistachio Ghraybe": {
    name: "غريبة فستق",
    description: "تذوب في الفم — فستق إيراني وحلاوة خفيفة.",
  },
  "Aish El Saraya Cup": {
    name: "كوب عيش السرايا",
    description: "فتات كراميلي، سحابة قشطة، تاج فستق.",
  },
  "Mixed Petit Four Box": {
    name: "صندوق بتيفور مشكل",
    description: "تشكيلة يومية من الشيف — مثالي للهدايا.",
  },
  "Sugar-Free Almond Bar": {
    name: "بار لوز خالٍ من السكر",
    description: "محلّى بالستيفيا — لوز محموس وقاعدة شوكولاتة داكنة.",
  },
  "Akkawi Labneh Jar": {
    name: "برطمان لبنة عكاوي",
    description: "لبن مصفى، زيت زيتون، لمسة زعتر.",
  },
  "Kalamata Olives Marinated": {
    name: "زيتون كالاماتا متبل",
    description: "أعشاب، قشر ليمون، زيت بكر.",
  },
  "Promo: Kunafa + Drink": {
    name: "عرض: كنافة + مشروب",
    description: "حصة كنافة جبن مع جلاب أو ليمونادة الدار.",
  },
  "Mafrooke Pistachio": {
    name: "مفروكة فستق",
    description: "فتات سميد وزبدة مع قشطة ناعمة وفستق.",
  },
};

export function displayDbProduct(
  p: ProductDTO,
  locale: Locale
): { name: string; description: string } {
  if (locale === "en") return { name: p.name, description: p.description };
  const row = BY_NAME[p.name];
  return row ?? { name: p.name, description: p.description };
}
