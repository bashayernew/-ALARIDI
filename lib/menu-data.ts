/**
 * Single source of truth for the public menu (/menu).
 * Replace image paths with files in public/products/ — missing files show a gradient fallback.
 */

export type MenuProduct = {
  id: string;
  /** Product slug for /product links */
  slug?: string;
  /** Catalog category (set when loaded from Product table) */
  category?: string;
  name: string;
  description: string;
  /** Price in KWD */
  price: number;
  oldPrice?: number;
  /** Path under public/, e.g. /products/kunafa.jpg */
  image: string;
  bestSeller?: boolean;
  /** Show promo / discount styling when true or when oldPrice is set */
  promo?: boolean;
  customizable?: boolean;
  dietary?: Array<"sugar-free" | "vegan" | "gluten-free">;
  isNew?: boolean;
  stock?: "in-stock" | "low-stock" | "out-of-stock";
};

export type MenuSection = {
  slug: string;
  label: string;
  products: MenuProduct[];
};

const IMG = {
  /** Lebanese Saj Bread — asset in public/saj.jpg */
  saj: "/saj.jpg",
  /** Kaake Kunafa — public/kaake.jpg */
  kaake: "/kaake.jpg",
  /** Kunafa — public/kunafa.jpg */
  kunafa: "/kunafa.jpg",
  /** Baklawa Mix — official photo in public/products/baklawa-mix.jpeg */
  baklawaMix: "/products/baklawa-mix.jpeg",
  /** Mixed Baklawa Crystal Plate — public/mixedbaklawa.jpg */
  mixedBaklawaCrystal: "/mixedbaklawa.jpg",
  /** Assorted Diet Sweets Box — public/assorted.jpg */
  dietAssortedBox: "/assorted.jpg",
  baklavaMix: "/products/baklava-mix.jpg",
  /** Baloreye Cashew — official photo */
  baloreyeCashew: "/products/baloreye-cashew.jpeg",
  /** Burma Cashew — official photo */
  burmaCashew: "/products/burma-cashew.jpeg",
  /** Barazek — public/Barazek.png */
  barazek: "/Barazek.png",
  /** Lebanese Kunafa Cheese — official photo */
  lebaneseKunafaCheese: "/products/lebanese-kunafa-cheese.jpeg",
  /** Date maamoul — public/maamoul_dates.png */
  maamoulDates: "/maamoul_dates.png",
  /** Walnut maamoul — public/maamoul_walnut.png */
  maamoulWalnut: "/maamoul_walnut.png",
  /** Maamoul Pistachio — public/maamoul_pistactio.png */
  maamoulPistachio: "/maamoul_pistactio.png",
  /** Karabeej — public/Karabeej.png */
  karabeej: "/Karabeej.png",
  /** Kuwaiti Ghrayba — public/kuwaiti ghrayba.png */
  kuwaitiGhrayba: "/kuwaiti%20ghrayba.png",
  maamoul: "/products/maamoul-dates.jpg",
  /** Mafrooke Pistachio — official photo */
  mafrookePistachio: "/products/mafrooke-pistachio.jpeg",
  /** Mafrooke — public/mafrooke.jpg */
  mafrouke: "/mafrooke.jpg",
  /** Goat Labne — public/goat labn.png */
  goatLabne: "/goat%20labn.png",
  /** Green Olives — public/green_olives.png */
  greenOlives: "/green_olives.png",
  /** Black Olives — public/black_olives.png */
  blackOlives: "/black_olives.png",
  /** Pickled Beans — public/pickled_beans.png */
  pickledBeans: "/pickled_beans.png",
  /** Namoura — public/Namoura.png */
  namoura: "/Namoura.png",
  /** Maha Eyes — public/Maha_Eyes.png */
  mahaEyes: "/Maha_Eyes.png",
  /** Halawet El Jiben — public/Halawet_El_Jiben.png */
  halawetElJiben: "/Halawet_El_Jiben.png",
  /** Dibs El Enab — public/Dibs El Enab.png */
  dibsElEnab: "/Dibs%20El%20Enab.png",
  /** Burma Pistachio — public/burma_pistachio.png */
  burmaPistachio: "/burma_pistachio.png",
  /** Esh Al Belbol Pistachio — public/esh al belbol pistachio.png */
  eshBelbolPistachio: "/esh%20al%20belbol%20pistachio.png",
  /** Esh Al Belbol Cashew — public/esh al balbol cashew.png */
  eshBelbolCashew: "/esh%20al%20balbol%20cashew.png",
  /** Baklawa Crescent Walnuts — public/baklawa crescent walnuts.png */
  baklawaCrescentWalnuts: "/baklawa%20crescent%20walnuts.png",
  /** Baklawa Pistachio — public/pistachio baklava.png */
  baklawaPistachio: "/pistachio%20baklava.png",
  /** Baklawa Fingers Cashew — public/baklawa fingers cachew.png */
  baklawaFingersCashew: "/baklawa%20fingers%20cachew.png",
  /** Koul W Shkour Cashew — public/koul W Shkour cachew.png */
  koulWShkourCashew: "/koul%20W%20Shkour%20cachew.png",
  /** Bismah Pistachios — public/bismah_pistachio.png */
  bismahPistachio: "/bismah_pistachio.png",
  /** Basmah Cashew — public/basmah_cashew.png */
  basmahCashew: "/basmah_cashew.png",
  labne: "/products/goat-labne.jpg",
} as const;

export const MENU_SECTIONS: MenuSection[] = [
  {
    slug: "kunafa",
    label: "Kunafa",
    products: [
      {
        id: "kf-lebanese-cheese",
        name: "Lebanese Kunafa Cheese",
        description: "Roasted semolina with beef ghee, stuffed with fresh cheese.",
        price: 1.75,
        image: "/products/lebanese-kunafa-cheese.jpeg",
      },
    ],
  },
  {
    slug: "baklava",
    label: "Baklava",
    products: [
      {
        id: "mt-baklawa-mix",
        name: "Baklawa Mix",
        description: "Chef’s cut assortment — pistachio, cashew, clarified butter.",
        price: 3.5,
        image: IMG.baklawaMix,
        bestSeller: true,
      },
      {
        id: "bv-sorar-cashew",
        name: "Baklawa Sorar Cashew",
        description: "Prepared from crisp dough sheets, stuffed with cashew and sweetened with syrup.",
        price: 3.0,
        image: "/products/baklawa-sorar-cashew.jpeg",
      },
      {
        id: "bv-sorar-pistachio",
        name: "Baklawa Sorar Pistachio",
        description: "Prepared from crisp dough sheets, stuffed with pistachio and sweetened with syrup.",
        price: 3.0,
        image: "/products/baklawa-sorar-pistachio.jpeg",
      },
      {
        id: "bv-koul-w-shkour-pistachio",
        name: "Koul W Shkour Pistachio",
        description: "Prepared from crisp dough sheets, stuffed with pistachio and sweetened with syrup.",
        price: 3.0,
        image: "/products/baklawa-koul-w-shkour-pistachio.jpeg",
      },
      {
        id: "bv-baloreye-pistachio",
        name: "Baloreye Pistachio",
        description: "Made of fine vermicelli stuffed with pistachios, sweetened with syrup.",
        price: 3.5,
        image: "/products/baloreye-pistachio.jpeg",
      },
      {
        id: "bv-osmalia-kashta",
        name: "Osmalia Kashta",
        description: "Two layers of roasted fine vermicelli, stuffed with cream.",
        price: 2.0,
        image: "/products/osmalia-kashta.jpeg",
      },
      {
        id: "bv-baloreye",
        name: "Baloreye Cashew",
        description: "Layered cashew baklava — light syrup.",
        price: 3.0,
        image: IMG.baloreyeCashew,
      },
      {
        id: "bv-baklawa-pistachio",
        name: "Baklawa Pistachio",
        description: "Iranian pistachio, clarified butter.",
        price: 3.25,
        image: IMG.baklawaPistachio,
      },
      {
        id: "bv-burma-pistachio",
        name: "Burma Pistachio",
        description: "Rolled shredded wheat, pistachio filling.",
        price: 3.75,
        image: IMG.burmaPistachio,
        bestSeller: true,
      },
      {
        id: "bv-esh-belbol",
        name: "Esh Al Belbol Pistachio",
        description: "Bird’s-nest pastry with fragrant pistachio.",
        price: 4.0,
        image: IMG.eshBelbolPistachio,
      },
      {
        id: "bv-esh-belbol-cashew",
        name: "Esh Al Belbol Cashew",
        description: "Bird’s-nest pastry with roasted cashew.",
        price: 4.0,
        image: IMG.eshBelbolCashew,
      },
      {
        id: "bv-burma-cashew",
        name: "Burma Cashew",
        description: "Crunchy rolls with cashew cream.",
        price: 3.0,
        image: IMG.burmaCashew,
      },
      {
        id: "bv-crescent-walnut",
        name: "Baklawa Crescent Walnuts",
        description: "Walnut-forward crescents, delicate attar.",
        price: 3.0,
        image: IMG.baklawaCrescentWalnuts,
      },
      {
        id: "bv-fingers-cashew",
        name: "Baklawa Fingers Cashew",
        description: "Finger cuts with cashew — crisp finish.",
        price: 3.25,
        image: IMG.baklawaFingersCashew,
      },
      {
        id: "bv-koul-w-shkour-cashew",
        name: "Koul W Shkour Cashew",
        description: "Rolled phyllo cylinders packed with roasted cashew.",
        price: 3.25,
        image: IMG.koulWShkourCashew,
      },
    ],
  },
  {
    slug: "basmah",
    label: "Basmah",
    products: [
      {
        id: "bs-mix-nuts",
        name: "Basma Mix Nuts",
        description: "Prepared from kunafa dough and mixed nuts, sweetened with syrup.",
        price: 3.25,
        image: "/products/basma-mix-nuts.jpeg",
      },
      {
        id: "bs-pistachio",
        name: "Bismah Pistachios",
        description: "Hand-cut basmah squares — pistachio crown.",
        price: 2.75,
        image: IMG.bismahPistachio,
      },
      {
        id: "bs-cashew",
        name: "Basmah Cashew",
        description: "Cashew cream, whisper of rose.",
        price: 2.5,
        image: IMG.basmahCashew,
      },
    ],
  },
  {
    slug: "maamoul",
    label: "Maamoul",
    products: [
      {
        id: "mm-walnuts-chocolate",
        name: "Maamoul Walnuts & Chocolate",
        description: "Prepared from semolina and walnuts, dipped in chocolate.",
        price: 2.5,
        image: "/products/maamoul-walnuts-chocolate.jpeg",
      },
      {
        id: "mm-dates",
        name: "Maamoul Dates",
        description: "Semolina shell, slow-cooked date paste.",
        price: 5.0,
        image: IMG.maamoulDates,
      },
      {
        id: "mm-pistachio",
        name: "Maamoul Pistachio",
        description: "Green pistachio centre, orange blossom.",
        price: 2.5,
        image: IMG.maamoulPistachio,
      },
      {
        id: "mm-karabeej",
        name: "Karabeej",
        description: "Lebanese semolina cookies with pistachio.",
        price: 2.75,
        image: IMG.karabeej,
      },
      {
        id: "mm-walnuts",
        name: "Maamoul Walnuts",
        description: "Toasted walnut filling, delicate dusting.",
        price: 2.5,
        image: IMG.maamoulWalnut,
      },
    ],
  },
  {
    slug: "ghraybe",
    label: "Ghraybe",
    products: [
      {
        id: "gh-ghraybe",
        name: "Ghraybe",
        description: "Prepared from ghee, sugar and flour.",
        price: 1.5,
        image: "/products/ghraybe.jpeg",
      },
      {
        id: "gh-maha-eyes-chocolate",
        name: "Maha Eyes with Chocolate",
        description: "Prepared from ghee, sugar and flour, dipped in chocolate.",
        price: 1.75,
        image: "/products/maha-eyes-with-chocolate.jpeg",
      },
      {
        id: "gh-kuwaiti",
        name: "Kuwaiti Ghrayba Pistachio",
        description: "Shortbread melt — pistachio-forward.",
        price: 1.5,
        image: IMG.kuwaitiGhrayba,
      },
      {
        id: "gh-maha",
        name: "Maha Eyes",
        description: "Delicate ghraybe rounds — signature finish.",
        price: 1.5,
        image: IMG.mahaEyes,
      },
    ],
  },
  {
    slug: "kashta-sweets",
    label: "Kashta Sweets",
    products: [
      {
        id: "ks-warbat-kashta",
        name: "Warbat Kashta",
        description: "Crisp dough sheets stuffed with fresh cream, sweetened with syrup.",
        price: 2.0,
        image: "/products/warbat-kashta.jpeg",
      },
      {
        id: "ks-halawet",
        name: "Halawet El Jiben",
        description: "Cheese dough rolls, kashta, pistachio.",
        price: 2.0,
        image: IMG.halawetElJiben,
      },
      {
        id: "ks-mafrooke-p",
        name: "Mafrooke Pistachio",
        description: "Silky semolina crumble with kashta and pistachio.",
        price: 3.0,
        image: IMG.mafrookePistachio,
        customizable: true,
      },
      {
        id: "ks-mafrooke",
        name: "Mafrooke",
        description: "House mafrooke — kashta and semolina crumble.",
        price: 2.0,
        image: IMG.mafrouke,
        bestSeller: true,
      },
    ],
  },
  {
    slug: "assorted-sweets",
    label: "Assorted Sweets",
    products: [
      {
        id: "as-namoora-kashta",
        name: "Namoora Kashta",
        description: "Semolina cake stuffed with cream and soaked in sugar syrup.",
        price: 1.5,
        image: "/products/namoora-kashta.jpeg",
      },
      {
        id: "as-barazek-chocolate",
        name: "Barazek Chocolate",
        description: "Roasted sesame and pistachio biscuits, dipped in chocolate.",
        price: 1.75,
        image: "/products/barazek-chocolate.jpeg",
      },
      {
        id: "as-lawzeye",
        name: "Lawzeye",
        description: "Flour, butter and ground almonds, covered with fine sugar.",
        price: 1.75,
        image: "/products/lawzeye.jpeg",
      },
      {
        id: "as-katayef-kashta",
        name: "Katayef Kashta",
        description: "Qatayef dough stuffed with cream.",
        price: 1.75,
        image: "/products/katayef-kashta.jpeg",
      },
      {
        id: "as-katayef-walnut",
        name: "Katayef Walnut",
        description: "Qatayef dough stuffed with walnuts.",
        price: 1.75,
        image: "/products/katayef-walnut.jpeg",
      },
      {
        id: "as-znood-al-set",
        name: "Znood Al Set",
        description: "Fried baklava dough stuffed with cream, sweetened with syrup.",
        price: 1.75,
        image: "/products/znood-al-set.jpeg",
      },
      {
        id: "as-balah-sham",
        name: "Balah Sham",
        description: "Chef's special dough cut in zigzag shapes and soaked in syrup.",
        price: 1.25,
        image: "/products/balah-sham.jpeg",
      },
      {
        id: "as-awamat",
        name: "Awamat",
        description: "Chef's special dough scooped in small rounds and soaked in syrup.",
        price: 1.25,
        image: "/products/awamat.jpeg",
      },
      {
        id: "as-namoura",
        name: "Namoura",
        description: "Semolina cake, almond syrup.",
        price: 1.5,
        image: IMG.namoura,
      },
      {
        id: "as-barazek",
        name: "Barazek",
        description: "Sesame-pistachio crisp biscuits.",
        price: 3.5,
        image: IMG.barazek,
        dietary: ["sugar-free"],
      },
    ],
  },
  {
    slug: "lebanese-moone",
    label: "Lebanese Moone",
    products: [
      {
        id: "mo-labne",
        name: "Goat Labne",
        description: "Strained goat labneh — olive oil pool.",
        price: 6.0,
        image: IMG.goatLabne,
      },
      {
        id: "mo-black-olives",
        name: "Black Olives",
        description: "Marinated Kalamata-style — herb & citrus.",
        price: 3.5,
        image: IMG.blackOlives,
      },
      {
        id: "mo-green-olives",
        name: "Green Olives",
        description: "Cracked green olives, chili & lemon.",
        price: 3.5,
        image: IMG.greenOlives,
      },
      {
        id: "mo-beans",
        name: "Pickled Beans",
        description: "House pickles — crisp and tangy.",
        price: 3.0,
        image: IMG.pickledBeans,
      },
      {
        id: "dt-dibs",
        name: "Dibs El Enab",
        description: "Grape molasses sweets — naturally deep flavour.",
        price: 3.5,
        image: IMG.dibsElEnab,
      },
    ],
  },
];

export const MENU_SLUGS = MENU_SECTIONS.map((s) => s.slug);
