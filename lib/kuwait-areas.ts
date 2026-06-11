export type KuwaitArea = {
  key: string;
  nameEn: string;
  nameAr: string;
};

export type KuwaitGovernorate = {
  key: string;
  nameEn: string;
  nameAr: string;
  areas: KuwaitArea[];
};

/** All six governorates with standard residential areas (stable kebab keys). */
export const KUWAIT_GOVERNORATES: KuwaitGovernorate[] = [
  {
    key: "capital",
    nameEn: "Capital (Al Asimah)",
    nameAr: "العاصمة",
    areas: [
      { key: "sharq", nameEn: "Sharq", nameAr: "شرق" },
      { key: "qibla", nameEn: "Qibla", nameAr: "قبلة" },
      { key: "dasma", nameEn: "Dasma", nameAr: "الدسمة" },
      { key: "shamiya", nameEn: "Shamiya", nameAr: "الشامية" },
      { key: "qadsiya", nameEn: "Qadsiya", nameAr: "القادسية" },
      { key: "mansouriya", nameEn: "Mansouriya", nameAr: "المنصورية" },
      { key: "yarmouk", nameEn: "Yarmouk", nameAr: "اليرموك" },
      { key: "surra", nameEn: "Surra", nameAr: "السرة" },
      { key: "adailiya", nameEn: "Adailiya", nameAr: "العديلية" },
      { key: "khaldiya", nameEn: "Khaldiya", nameAr: "الخالدية" },
      { key: "rawda", nameEn: "Rawda", nameAr: "الروضة" },
      { key: "kaifan", nameEn: "Kaifan", nameAr: "كيفان" },
      { key: "nuzha", nameEn: "Nuzha", nameAr: "النزهة" },
      { key: "faiha", nameEn: "Faiha", nameAr: "الفيحاء" },
      { key: "daiya", nameEn: "Daiya", nameAr: "الدعية" },
      { key: "bneid-al-qar", nameEn: "Bneid Al-Qar", nameAr: "بنيد القار" },
      { key: "dahar", nameEn: "Dahar", nameAr: "الضهر" },
      { key: "granada", nameEn: "Granada", nameAr: "غرناطة" },
      { key: "shuhada", nameEn: "Shuhada", nameAr: "الشهداء" },
      { key: "sulaibikhat", nameEn: "Sulaibikhat", nameAr: "الصليبيخات" },
      { key: "qurtuba", nameEn: "Qurtuba", nameAr: "قرطبة" },
      { key: "shuwaikh", nameEn: "Shuwaikh", nameAr: "الشويخ" },
      { key: "shamiya-block-1", nameEn: "Shamiya Blocks", nameAr: "قطع الشامية" },
      { key: "dasman", nameEn: "Dasman", nameAr: "دسمان" },
    ],
  },
  {
    key: "hawalli",
    nameEn: "Hawalli",
    nameAr: "حولي",
    areas: [
      { key: "salmiya", nameEn: "Salmiya", nameAr: "السالمية" },
      { key: "jabriya", nameEn: "Jabriya", nameAr: "الجابرية" },
      { key: "rumaithiya", nameEn: "Rumaithiya", nameAr: "الرميثية" },
      { key: "bayan", nameEn: "Bayan", nameAr: "بيان" },
      { key: "mishref", nameEn: "Mishref", nameAr: "مشرف" },
      { key: "salwa", nameEn: "Salwa", nameAr: "سلوى" },
      { key: "hawalli-city", nameEn: "Hawalli", nameAr: "حولي" },
      { key: "shaab", nameEn: "Shaab", nameAr: "الشعب" },
      { key: "siddiq", nameEn: "Siddiq", nameAr: "الصديق" },
      { key: "salam", nameEn: "Salam", nameAr: "السلام" },
      { key: "hiteen", nameEn: "Hiteen", nameAr: "حطين" },
      { key: "zahra", nameEn: "Zahra", nameAr: "الزهراء" },
      { key: "shuhada-hawalli", nameEn: "Shuhada", nameAr: "الشهداء" },
      { key: "nugra", nameEn: "Nugra", nameAr: "النقرة" },
      { key: "mubarak-al-abdullah", nameEn: "Mubarak Al-Abdullah", nameAr: "مبارك العبدالله" },
    ],
  },
  {
    key: "farwaniya",
    nameEn: "Farwaniya (Al Farwaniyah)",
    nameAr: "الفروانية",
    areas: [
      { key: "farwaniya-city", nameEn: "Farwaniya", nameAr: "الفروانية" },
      { key: "khaitan", nameEn: "Khaitan", nameAr: "خيطان" },
      { key: "jleeb-al-shuyoukh", nameEn: "Jleeb Al-Shuyoukh", nameAr: "جليب الشيوخ" },
      { key: "riggae", nameEn: "Riggae", nameAr: "الرقعي" },
      { key: "andalous", nameEn: "Andalous", nameAr: "الأندلس" },
      { key: "ardiya", nameEn: "Ardiya", nameAr: "العارضية" },
      { key: "rabia", nameEn: "Rabia", nameAr: "الرابية" },
      { key: "omariya", nameEn: "Omariya", nameAr: "العمرية" },
      { key: "ferdous", nameEn: "Ferdous", nameAr: "الفردوس" },
      { key: "rai", nameEn: "Rai", nameAr: "الري" },
      { key: "rehab", nameEn: "Rehab", nameAr: "الرحاب" },
      { key: "sabah-al-nasser", nameEn: "Sabah Al-Nasser", nameAr: "صباح الناصر" },
      { key: "ishbiliya", nameEn: "Ishbiliya", nameAr: "اشبيلية" },
      { key: "dhajeej", nameEn: "Dhajeej", nameAr: "الضجيج" },
      { key: "abdullah-al-mubarak", nameEn: "Abdullah Al-Mubarak", nameAr: "عبدالله المبارك" },
    ],
  },
  {
    key: "ahmadi",
    nameEn: "Ahmadi (Al Ahmadi)",
    nameAr: "الأحمدي",
    areas: [
      { key: "mangaf", nameEn: "Mangaf", nameAr: "المنقف" },
      { key: "mahboula", nameEn: "Mahboula", nameAr: "المهبولة" },
      { key: "fahaheel", nameEn: "Fahaheel", nameAr: "الفحيحيل" },
      { key: "abu-halifa", nameEn: "Abu Halifa", nameAr: "أبو حليفة" },
      { key: "fintas", nameEn: "Fintas", nameAr: "الفنطاس" },
      { key: "egaila", nameEn: "Egaila", nameAr: "العقيلة" },
      { key: "sabah-al-salem-ahmadi", nameEn: "Sabah Al-Salem", nameAr: "صباح السالم" },
      { key: "riqqa", nameEn: "Riqqa", nameAr: "الرقة" },
      { key: "hadiya", nameEn: "Hadiya", nameAr: "هدية" },
      { key: "ahmadi-city", nameEn: "Ahmadi", nameAr: "الأحمدي" },
      { key: "wafra", nameEn: "Wafra", nameAr: "الوفرة" },
      { key: "fahaheel-industrial", nameEn: "Fahaheel Industrial", nameAr: "الفحيحيل الصناعية" },
      { key: "nuwaiseeb", nameEn: "Nuwaiseeb", nameAr: "النويصيب" },
      { key: "khiran", nameEn: "Khiran", nameAr: "الخيران" },
      { key: "zour", nameEn: "Zour", nameAr: "الزور" },
    ],
  },
  {
    key: "jahra",
    nameEn: "Jahra (Al Jahra)",
    nameAr: "الجهراء",
    areas: [
      { key: "jahra-city", nameEn: "Jahra", nameAr: "الجهراء" },
      { key: "naseem", nameEn: "Naseem", nameAr: "النسيم" },
      { key: "qasr", nameEn: "Qasr", nameAr: "القصر" },
      { key: "saad-al-abdullah", nameEn: "Saad Al-Abdullah", nameAr: "سعد العبدالله" },
      { key: "oyoun", nameEn: "Oyoun", nameAr: "العيون" },
      { key: "taima", nameEn: "Taima", nameAr: "تيماء" },
      { key: "sulaibiya", nameEn: "Sulaibiya", nameAr: "الصليبية" },
      { key: "abdali", nameEn: "Abdali", nameAr: "العبدلي" },
      { key: "kabd", nameEn: "Kabd", nameAr: "كبد" },
      { key: "waha", nameEn: "Waha", nameAr: "الواحة" },
      { key: "naseem-jahra", nameEn: "Naseem (Jahra blocks)", nameAr: "نسيم الجهراء" },
    ],
  },
  {
    key: "mubarak-al-kabeer",
    nameEn: "Mubarak Al-Kabeer",
    nameAr: "مبارك الكبير",
    areas: [
      { key: "sabah-al-salem-mubarak", nameEn: "Sabah Al-Salem", nameAr: "صباح السالم" },
      { key: "mubarak-al-kabeer-city", nameEn: "Mubarak Al-Kabeer", nameAr: "مبارك الكبير" },
      { key: "adan", nameEn: "Adan", nameAr: "العدان" },
      { key: "qurain", nameEn: "Qurain", nameAr: "القرين" },
      { key: "qusour", nameEn: "Qusour", nameAr: "القصور" },
      { key: "messila", nameEn: "Messila", nameAr: "المسيلة" },
      { key: "abu-futaira", nameEn: "Abu Futaira", nameAr: "أبو فطيرة" },
      { key: "funaitees", nameEn: "Funaitees", nameAr: "الفنيطيس" },
      { key: "sabah-al-salem-blocks", nameEn: "Sabah Al-Salem Blocks", nameAr: "قطع صباح السالم" },
      { key: "qurtuba-mubarak", nameEn: "Qurtuba", nameAr: "قرطبة" },
    ],
  },
];

export type SelectedKuwaitArea = {
  governorateKey: string;
  areaKey: string;
};

export const STOREFRONT_AREA_COOKIE = "al_aridi_area";

export function parseAreaCookie(
  value: string | undefined
): SelectedKuwaitArea | null {
  if (!value?.trim()) return null;
  const idx = value.indexOf(":");
  if (idx <= 0 || idx >= value.length - 1) return null;
  const governorateKey = value.slice(0, idx);
  const areaKey = value.slice(idx + 1);
  if (!findArea(governorateKey, areaKey)) return null;
  return { governorateKey, areaKey };
}

export function formatAreaCookieValue(sel: SelectedKuwaitArea): string {
  return `${sel.governorateKey}:${sel.areaKey}`;
}

export function findGovernorate(key: string): KuwaitGovernorate | undefined {
  return KUWAIT_GOVERNORATES.find((g) => g.key === key);
}

export function findArea(
  governorateKey: string,
  areaKey: string
): { governorate: KuwaitGovernorate; area: KuwaitArea } | null {
  const governorate = findGovernorate(governorateKey);
  if (!governorate) return null;
  const area = governorate.areas.find((a) => a.key === areaKey);
  if (!area) return null;
  return { governorate, area };
}

export function areaDisplayLabel(
  sel: SelectedKuwaitArea,
  locale: "en" | "ar"
): string {
  const hit = findArea(sel.governorateKey, sel.areaKey);
  if (!hit) return sel.areaKey;
  const areaName = locale === "ar" ? hit.area.nameAr : hit.area.nameEn;
  const govName =
    locale === "ar" ? hit.governorate.nameAr : hit.governorate.nameEn;
  return `${areaName}, ${govName}`;
}

export function deliveryAreaIdFromSelection(sel: SelectedKuwaitArea): string {
  return formatAreaCookieValue(sel);
}
