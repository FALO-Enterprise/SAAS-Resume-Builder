import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  ArrowRight,
  FileCheck2,
  Globe,
  Lock,
  ScanLine,
  Scissors,
  ShieldCheck,
} from "lucide-react";

import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import SectionLabel from "@/components/ui/SectionLabel";
import RichText from "@/components/ui/legal/RichText";
import { routing } from "@/i18n/routing";
import { LEGAL_CONFIG, legalHref } from "@/lib/legal";
import {
  regionIds,
  statIds,
  values as valueMeta,
} from "@/lib/placeholder-data/about.placeholder";
import type {
  AboutChapter,
  AboutIcon,
  AboutRegion,
  AboutStat,
  AboutValue,
} from "@/lib/types/about.types";
import Reveal from "./Reveal";

type Params = { params: Promise<{ locale: string }> };

const ABOUT_ROUTE = "about";

const VALUE_ICONS: Record<AboutIcon, typeof ShieldCheck> = {
  "shield-check": ShieldCheck,
  "scan-line": ScanLine,
  scissors: Scissors,
  globe: Globe,
  lock: Lock,
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  const title = `${t("eyebrow")} — ResuMax`;
  const description = t("metaDescription");

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/${ABOUT_ROUTE}`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `/${l}/${ABOUT_ROUTE}`]),
      ),
    },
    openGraph: { title, description, type: "website" },
  };
}

export default async function Page({ params }: Params) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  const chapters = t.raw("story.chapters") as AboutChapter[];
  const stats = t.raw("stats.items") as Record<string, AboutStat>;
  const values = t.raw("values.items") as Record<string, AboutValue>;
  const regions = t.raw("reach.regions") as AboutRegion[];

  const regionById = new Map(regions.map((region) => [region.id, region]));

  const companyFacts = [
    { key: "operator", value: LEGAL_CONFIG.entity, ltr: true },
    { key: "product", value: LEGAL_CONFIG.product, ltr: true },
    { key: "domain", value: LEGAL_CONFIG.domain, ltr: true },
    { key: "support", value: LEGAL_CONFIG.contact.support, ltr: true },
    { key: "privacy", value: LEGAL_CONFIG.contact.privacy, ltr: true },
    { key: "legal", value: LEGAL_CONFIG.contact.legal, ltr: true },
  ];

  return (
    <main className="relative min-h-screen">
      <Navbar />

      {/* ── Hero. One manifesto sentence, nothing competing with it ────── */}
      <header className="relative overflow-hidden pt-32 pb-16">

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <div className="flex justify-center">
            <SectionLabel text={t("eyebrow")} color="gold" />
          </div>

          <h1 className="mt-6 font-playfair text-[34px] font-black leading-[1.15] text-primary sm:text-5xl">
            {t("title")}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-[16.5px] leading-[1.8] text-secondary">
            {t("subtitle")}
          </p>
        </div>
      </header>

      {/* ── Story ──────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="about-story-heading"
        className="relative z-10 mx-auto max-w-3xl px-6 pb-24"
      >
        <Reveal>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-gold">
            {t("story.eyebrow")}
          </p>
          <h2
            id="about-story-heading"
            className="mb-12 font-playfair text-[28px] font-bold leading-snug text-primary sm:text-[32px]"
          >
            {t("story.title")}
          </h2>
        </Reveal>

        <div className="space-y-14">
          {chapters.map((chapter, i) => (
            <Reveal key={chapter.id} delay={i * 0.05}>
              <section id={chapter.id} className="scroll-mt-28">
                <h3 className="mb-5 font-playfair text-[21px] font-bold text-primary">
                  {chapter.title}
                </h3>

                <div className="space-y-5">
                  {chapter.blocks.map((block, j) =>
                    block.type === "quote" ? (
                      <figure
                        key={j}
                        className="border-s-2 border-gold/40 py-1 ps-6"
                      >
                        <blockquote className="font-playfair text-[20px] leading-[1.6] text-primary">
                          <RichText text={block.text} locale={locale} />
                        </blockquote>
                        {block.attribution && (
                          <figcaption className="mt-2 text-[13px] text-muted">
                            — {block.attribution}
                          </figcaption>
                        )}
                      </figure>
                    ) : (
                      <p
                        key={j}
                        className="text-[16.5px] leading-[1.8] text-secondary"
                      >
                        <RichText text={block.text} locale={locale} />
                      </p>
                    ),
                  )}
                </div>
              </section>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Stats. A breather between narrative and standards ──────────── */}
      <section
        aria-labelledby="about-stats-heading"
        className="relative z-10 border-y border-edge bg-soft/40"
      >
        <div className="mx-auto max-w-5xl px-6 py-14">
          <h2 id="about-stats-heading" className="sr-only">
            {t("stats.eyebrow")}
          </h2>

          <Reveal>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
              {statIds.map((id) => (
                // `dt` must precede `dd` to be valid, but the figure reads
                // first visually — column-reverse gives both without repeating
                // the label in an `sr-only` node.
                <div key={id} className="flex flex-col-reverse text-center">
                  <dt className="mx-auto mt-2 max-w-[16rem] text-[13px] leading-[1.6] text-secondary">
                    {stats[id].label}
                  </dt>
                  <dd className="font-playfair text-4xl font-black text-gradient-gold">
                    {/* Figures stay LTR; Arabic keeps Western digits here to
                        match how the rest of the product renders numbers. */}
                    <span dir="ltr">{stats[id].value}</span>
                  </dd>
                </div>
              ))}
            </dl>

            <p className="mx-auto mt-10 max-w-2xl text-center text-[12.5px] leading-[1.7] text-muted">
              {t("stats.note")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Values. Rows rather than an icon-card grid ─────────────────── */}
      <section
        aria-labelledby="about-values-heading"
        className="relative z-10 mx-auto max-w-4xl px-6 py-24"
      >
        <Reveal className="mb-14 text-center">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-gold">
            {t("values.eyebrow")}
          </p>
          <h2
            id="about-values-heading"
            className="mb-4 font-playfair text-[28px] font-bold text-primary sm:text-[32px]"
          >
            {t("values.title")}
          </h2>
          <p className="mx-auto max-w-2xl text-[15.5px] leading-[1.75] text-secondary">
            {t("values.subtitle")}
          </p>
        </Reveal>

        <ol className="space-y-px overflow-hidden rounded-3xl border border-edge">
          {valueMeta.map(({ id, icon, accent }, i) => {
            const Icon = VALUE_ICONS[icon];
            const value = values[id];

            return (
              <li key={id} className="bg-elevated">
                <Reveal delay={i * 0.05}>
                  <div className="flex flex-col gap-5 border-b border-edge p-7 last:border-b-0 sm:flex-row sm:gap-7 sm:p-8">
                    <div className="flex items-center gap-4 sm:block">
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${accent.wrap} ${accent.icon}`}
                      >
                        <Icon size={19} />
                      </span>
                      <span
                        aria-hidden
                        className="mt-4 hidden text-[12px] font-bold text-faint sm:block"
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h3 className="mb-2 text-[18px] font-bold text-primary">
                        {value.title}
                      </h3>
                      <p className="text-[15.5px] leading-[1.75] text-secondary">
                        {value.description}
                      </p>
                    </div>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ── Reach ──────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="about-reach-heading"
        className="relative z-10 mx-auto max-w-5xl px-6 pb-24"
      >
        <Reveal className="mb-12 text-center">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-gold">
            {t("reach.eyebrow")}
          </p>
          <h2
            id="about-reach-heading"
            className="mb-4 font-playfair text-[28px] font-bold text-primary sm:text-[32px]"
          >
            {t("reach.title")}
          </h2>
          <p className="mx-auto max-w-2xl text-[15.5px] leading-[1.75] text-secondary">
            {t("reach.subtitle")}
          </p>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {regionIds.map((id, i) => {
            const region = regionById.get(id);
            if (!region) return null;

            return (
              <Reveal key={id} delay={i * 0.05}>
                <div className="glass h-full rounded-2xl border border-edge p-5 transition-colors hover:border-gold/30">
                  <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-gold/20 bg-gold/10 text-gold">
                    <FileCheck2 size={16} />
                  </span>
                  <h3 className="mb-1.5 text-[15px] font-bold text-primary">
                    {region.label}
                  </h3>
                  <p className="text-[13.5px] leading-[1.65] text-secondary">
                    {region.note}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ── Who operates the service. Low on the page, per convention ──── */}
      <section
        aria-labelledby="about-company-heading"
        className="relative z-10 mx-auto max-w-4xl px-6 pb-24"
      >
        <Reveal>
          <div className="glass rounded-3xl border border-edge p-7 sm:p-10">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-gold">
              {t("company.eyebrow")}
            </p>
            <h2
              id="about-company-heading"
              className="mb-3 font-playfair text-2xl font-bold text-primary"
            >
              {t("company.title")}
            </h2>
            <p className="mb-8 max-w-xl text-[15px] leading-[1.75] text-secondary">
              {t("company.subtitle")}
            </p>

            <dl className="grid gap-x-8 gap-y-5 border-t border-edge pt-8 sm:grid-cols-2">
              {companyFacts.map(({ key, value, ltr }) => (
                <div key={key}>
                  <dt className="mb-1 text-[11px] font-bold uppercase tracking-wider text-faint">
                    {t(`company.facts.${key}`)}
                  </dt>
                  <dd className="text-[14.5px] font-medium text-primary">
                    {key === "support" ||
                    key === "privacy" ||
                    key === "legal" ? (
                      <a
                        href={`mailto:${value}`}
                        dir="ltr"
                        className="inline-block text-gold underline decoration-gold/30 underline-offset-4 transition-colors hover:decoration-gold"
                      >
                        {value}
                      </a>
                    ) : (
                      <span dir={ltr ? "ltr" : undefined} className="inline-block">
                        {value}
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 border-t border-edge pt-6">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-faint">
                {t("company.linksTitle")}
              </p>
              <div className="flex flex-wrap gap-2.5">
                {[
                  { key: "privacy", href: legalHref("privacy", locale) },
                  { key: "terms", href: legalHref("terms", locale) },
                  { key: "help", href: `/${locale}/help` },
                ].map(({ key, href }) => (
                  <Link
                    key={key}
                    href={href}
                    className="rounded-full border border-edge px-4 py-2 text-[13px] font-semibold text-secondary no-underline transition-colors hover:border-gold/30 hover:text-gold"
                  >
                    {t(`company.links.${key}`)}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Closing CTA ────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-28">
        <Reveal>
          <div className="glass-gold rounded-3xl p-9 text-center sm:p-12">
            <h2 className="mb-3 font-playfair text-[26px] font-bold text-primary sm:text-3xl">
              {t("cta.title")}
            </h2>
            <p className="mx-auto mb-8 max-w-lg text-[15.5px] leading-[1.75] text-secondary">
              {t("cta.body")}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href={`/${locale}/resume/getstarted`}
                className="group inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-[14px] font-bold text-ink no-underline transition-colors hover:bg-gold-light"
              >
                {t("cta.button")}
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                />
              </Link>

              <Link
                href={`/${locale}/help#contact`}
                className="inline-flex items-center rounded-full border border-edge px-6 py-3 text-[14px] font-bold text-secondary no-underline transition-colors hover:border-edge-strong hover:text-primary"
              >
                {t("cta.secondary")}
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
    </main>
  );
}
