import type { Metadata } from "next";
import { Mail, MapPin, Phone, MessageCircle } from "lucide-react";
import { getLocale } from "@/lib/i18n-server";
import { translate, type TranslationKey } from "@/lib/dictionary";
import { ContactForm } from "@/components/contact-form";
import { fetchSiteContentMap } from "@/lib/site-content";
import { mergeSocialUrlsFromContent } from "@/lib/site-content-types";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Reach Al Aridi Sweets by phone, WhatsApp, email, or our online form. We deliver across Kuwait.",
};

const PHONE = process.env.NEXT_PUBLIC_PHONE || "+965 9999 9999";
const EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@alaridi.com";
const MAP_EMBED_URL =
  process.env.NEXT_PUBLIC_MAP_EMBED_URL ||
  "https://www.google.com/maps?q=Kuwait+City&output=embed";

export default async function ContactPage() {
  const locale = await getLocale();
  const t = (k: TranslationKey) => translate(locale, k);

  // WhatsApp number is managed in the admin dashboard (Site copy → WhatsApp).
  const socialUrls = mergeSocialUrlsFromContent(await fetchSiteContentMap());
  const whatsappUrl = socialUrls.whatsapp;
  const whatsappNumber = whatsappUrl.match(/(\d{6,})/)?.[1] ?? "";

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-12 sm:px-6">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          {t("contact.kicker")}
        </p>
        <h1 className="mt-2 font-heading text-4xl">{t("contact.title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("contact.subtitle")}</p>
      </header>

      <section className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-5">
          <a
            href={`tel:${PHONE.replace(/\s+/g, "")}`}
            className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/40 p-4 transition hover:border-primary/40"
          >
            <Phone className="mt-0.5 size-5 text-primary" />
            <div>
              <p className="font-medium">{t("contact.contact.phone")}</p>
              <p className="text-sm text-muted-foreground">{PHONE}</p>
            </div>
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/40 p-4 transition hover:border-primary/40"
          >
            <MessageCircle className="mt-0.5 size-5 text-primary" />
            <div>
              <p className="font-medium">{t("contact.contact.whatsapp")}</p>
              <p className="text-sm text-muted-foreground">
                {whatsappNumber ? `+${whatsappNumber}` : t("contact.contact.whatsapp")}
              </p>
            </div>
          </a>
          <a
            href={`mailto:${EMAIL}`}
            className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/40 p-4 transition hover:border-primary/40"
          >
            <Mail className="mt-0.5 size-5 text-primary" />
            <div>
              <p className="font-medium">{t("contact.contact.email")}</p>
              <p className="text-sm text-muted-foreground">{EMAIL}</p>
            </div>
          </a>
          <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/40 p-4">
            <MapPin className="mt-0.5 size-5 text-primary" />
            <div>
              <p className="font-medium">{t("contact.contact.location")}</p>
              <p className="text-sm text-muted-foreground">
                {t("contact.contact.location.body")}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border/60 bg-card/30 p-6">
          <h2 className="font-heading text-2xl">{t("contact.form.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("contact.form.subtitle")}
          </p>
          <div className="mt-5">
            <ContactForm />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-border/60">
        <iframe
          title="Al Aridi Sweets location"
          src={MAP_EMBED_URL}
          loading="lazy"
          className="h-[360px] w-full"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </section>
    </div>
  );
}
