import { getLocale } from "@/lib/i18n-server";
import { translate, type TranslationKey } from "@/lib/dictionary";

export const metadata = { title: "Privacy Policy" };

export default async function PrivacyPolicyPage() {
  const locale = await getLocale();
  const t = (k: TranslationKey) => translate(locale, k);
  const sections = [
    "privacy.section.collection",
    "privacy.section.use",
    "privacy.section.sharing",
    "privacy.section.cookies",
    "privacy.section.rights",
    "privacy.section.security",
    "privacy.section.contact",
  ] as const;

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-heading text-4xl">{t("privacy.title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("policy.updated")} {new Date().toLocaleDateString(locale === "ar" ? "ar-KW" : "en-KW")}
      </p>
      <p className="mt-6 text-base leading-relaxed text-muted-foreground">
        {t("privacy.intro")}
      </p>
      {sections.map((slug) => (
        <section key={slug} className="mt-8">
          <h2 className="font-heading text-2xl">
            {t(`${slug}.title` as TranslationKey)}
          </h2>
          <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-muted-foreground">
            {t(`${slug}.body` as TranslationKey)}
          </p>
        </section>
      ))}
    </article>
  );
}
