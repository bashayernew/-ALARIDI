import type { Metadata } from "next";
import Image from "next/image";
import { getLocale } from "@/lib/i18n-server";
import { translate, type TranslationKey } from "@/lib/dictionary";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Al Aridi Sweets — handcrafted Lebanese sweets in Kuwait. Our story, our mission, our sourcing standards.",
};

export default async function AboutPage() {
  const locale = await getLocale();
  const t = (k: TranslationKey) => translate(locale, k);

  const pillars: { key: "sourcing" | "quality" | "tradition" | "service" }[] = [
    { key: "sourcing" },
    { key: "quality" },
    { key: "tradition" },
    { key: "service" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-16 px-4 py-12 sm:px-6">
      <header className="grid items-center gap-8 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            {t("about.kicker")}
          </p>
          <h1 className="mt-2 font-heading text-4xl">{t("about.title")}</h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {t("about.intro")}
          </p>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted">
          <Image
            src="https://images.unsplash.com/photo-1605196560547-b2f7281b7355?auto=format&fit=crop&w=1200&q=80"
            alt="Al Aridi Sweets"
            fill
            className="object-cover"
            sizes="(max-width:768px) 100vw, 50vw"
          />
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="font-heading text-2xl">{t("about.story.title")}</h2>
        <p className="text-base leading-relaxed text-muted-foreground">
          {t("about.story.body1")}
        </p>
        <p className="text-base leading-relaxed text-muted-foreground">
          {t("about.story.body2")}
        </p>
      </section>

      <section className="rounded-3xl border border-primary/20 bg-secondary/15 p-8">
        <h2 className="font-heading text-2xl">{t("about.mission.title")}</h2>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {t("about.mission.body")}
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl">{t("about.pillars.title")}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {pillars.map((p) => (
            <article
              key={p.key}
              className="rounded-2xl border border-border/60 bg-card/40 p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                {t(`about.pillar.${p.key}.label` as TranslationKey)}
              </p>
              <h3 className="mt-2 font-heading text-xl">
                {t(`about.pillar.${p.key}.title` as TranslationKey)}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(`about.pillar.${p.key}.body` as TranslationKey)}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
