import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LifeBuoy } from "lucide-react";

import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import SectionLabel from "@/components/ui/SectionLabel";
import HelpBrowser from "@/components/ui/help/HelpBrowser";
import ContactForm from "@/components/ui/help/ContactForm";
import { LEGAL_CONFIG } from "@/lib/legal";
import { routing } from "@/i18n/routing";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "help" });

  const title = `${t("title")} — ResuMax Help Center`;
  const description = t("subtitle");

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/help`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `/${l}/help`]),
      ),
    },
    openGraph: {
      title: "ResuMax Help Center",
      description,
      type: "website",
    },
  };
}

export default async function HelpPage({ params }: Params) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "help" });

  return (
    <main className="relative min-h-screen">
      <Navbar />

      {/* ── Hero. Greeting + search, nothing competing above it. ─────────── */}
      <header className="relative overflow-hidden pt-32 pb-4">
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <div className="flex justify-center">
            <SectionLabel text={t("eyebrow")} color="gold" />
          </div>

          <h1 className="mt-5 font-playfair text-4xl font-black leading-tight text-primary lg:text-5xl">
            {t("title")}
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-[15.5px] leading-[1.75] text-secondary">
            {t("subtitle")}
          </p>
        </div>
      </header>

      {/* ── Search → categories → FAQ ───────────────────────────────────── */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 pt-8">
        <HelpBrowser
          contactHref="#contact"
          contactLabel={t("contact.title")}
        />
      </div>

      {/* ── Contact: the last resort, after self-service ────────────────── */}
      <section
        id="contact"
        aria-labelledby="help-contact-heading"
        className="relative mx-auto mt-20 max-w-5xl scroll-mt-24 px-6 pb-24"
      >
        <div className="glass rounded-3xl border border-edge p-6 sm:p-10">
          <div className="mb-8 flex flex-col items-start gap-4 border-b border-edge pb-8 sm:flex-row sm:items-center">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-gold/10 text-gold">
              <LifeBuoy size={20} />
            </span>
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-gold">
                {t("contact.eyebrow")}
              </p>
              <h2
                id="help-contact-heading"
                className="mb-1.5 font-playfair text-2xl font-bold text-primary"
              >
                {t("contact.title")}
              </h2>
              <p className="max-w-xl text-[14px] leading-[1.7] text-secondary">
                {t("contact.subtitle")}
              </p>
            </div>
          </div>

          {/* A four-field form does not need the full container width. */}
          <div className="max-w-2xl">
            <ContactForm supportEmail={LEGAL_CONFIG.contact.support} />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
