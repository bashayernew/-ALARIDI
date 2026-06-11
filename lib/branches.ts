/**
 * The fixed set of Al Aridi Sweets branches. Seeded into the `Branch` table
 * by scripts/seed-branches.ts (upsert by slug, so it is safe to re-run).
 */
export type BranchSeed = {
  slug: string;
  name: string;
  nameAr: string;
  area: string;
};

export const BRANCH_SEED: BranchSeed[] = [
  {
    slug: "salmiya-qatar-street",
    name: "Salmiya — Qatar Street",
    nameAr: "السالمية - شارع قطر",
    area: "Salmiya",
  },
  {
    slug: "kuwait-city-assima",
    name: "Kuwait City — Assima Mall",
    nameAr: "مدينة الكويت - مجمع الأصيمة",
    area: "Kuwait City",
  },
  {
    slug: "jahra-sahari",
    name: "Jahra — Sahari Mall",
    nameAr: "الجهراء - مجمع صحاري",
    area: "Jahra",
  },
  {
    slug: "egaila-date-mall",
    name: "Egaila — Date Mall",
    nameAr: "العقيلة - مجمع تمر",
    area: "Egaila",
  },
];

export type BranchDTO = {
  id: string;
  slug: string;
  name: string;
  nameAr: string;
  area: string;
};
