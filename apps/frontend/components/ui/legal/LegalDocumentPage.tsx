import { getTranslations } from "next-intl/server";
import Link from "next/link";
import {
  Shield,
  Lock,
  EyeOff,
  Trash2,
  Sparkles,
  CreditCard,
  Scale,
  FileCheck,
  Link2,
  CalendarClock,
  RefreshCw,
  Clock3,
  ArrowRight,
  Mail,
} from "lucide-react";

import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import SectionLabel from "@/components/ui/SectionLabel";
import LegalShell, { type TocEntry } from "./LegalShell";
import LegalBlocks from "./LegalBlocks";
import { LEGAL_CONFIG, LEGAL_MESSAGE_KEYS, legalHref } from "@/lib/legal";
import type {
  LegalBlock,
  LegalKeyPoint,
  LegalSection,
  LegalSlug,
} from "@/lib/types/legal.types";

const KEY_POINT_ICONS = {
  shield: Shield,
  lock: Lock,
  "eye-off": EyeOff,
  trash: Trash2,
  sparkles: Sparkles,
  "credit-card": CreditCard,
  scale: Scale,
  "file-check": FileCheck,
} as const;

/** Strips the inline markup tags so word counts measure prose, not syntax. */
function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, " ");
}

function blockToText(block: LegalBlock): string {
  switch (block.type) {
    case "paragraph":
      return block.text;
    case "callout":
      return `${block.title} ${block.text}`;
    case "list":
      return block.items.join(" ");
    case "definitions":
      return block.items.map((i) => `${i.term} ${i.text}`).join(" ");
    case "table":
      return [block.headers.join(" "), ...block.rows.map((r) => r.join(" "))].join(
        " ",
      );
  }
}

/**
 * Rough minutes-to-read.
 *
 * Uses 180 wpm rather than the usual 220 — legal prose is read more slowly
 * than editorial copy, and under-promising here is kinder than over-promising.
 * Arabic is counted by whitespace-delimited tokens too, which tracks closely
 * enough for an estimate rendered to the nearest minute.
 */
function estimateReadingMinutes(sections: LegalSection[]): number {
  const words = sections
    .flatMap((section) => [section.title, ...section.blocks.map(blockToText)])
    .join(" ");

  const count = stripTags(words).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(count / 180));
}

function formatDate(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

function KeyPointCard({ point }: { point: LegalKeyPoint }) {
  const Icon = KEY_POINT_ICONS[point.icon];
  return (
    <div className="glass rounded-2xl border border-edge p-5 transition-colors hover:border-gold/30">
      <span className="mb-3.5 flex h-9 w-9 items-center justify-center rounded-lg border border-gold/20 bg-gold/10 text-gold">
        <Icon size={17} />
      </span>
      <p className="mb-1.5 text-[14px] font-bold text-primary">{point.title}</p>
      <p className="text-[13.5px] leading-[1.65] text-secondary">
        {point.description}
      </p>
    </div>
  );
}

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <span className="flex items-center gap-2 text-[13px] text-faint">
      <Icon size={14} className="shrink-0 text-gold/70" />
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-secondary">{value}</span>
    </span>
  );
}

export default async function LegalDocumentPage({
  slug,
  locale,
}: {
  slug: LegalSlug;
  locale: string;
}) {
  // Chrome strings and the document itself both live in messages/{locale}.json.
  const t = await getTranslations({ locale, namespace: "legal" });
  const tDoc = await getTranslations({
    locale,
    namespace: LEGAL_MESSAGE_KEYS[slug],
  });
  const tOther = await getTranslations({
    locale,
    namespace: LEGAL_MESSAGE_KEYS[slug === "privacy" ? "terms" : "privacy"],
  });

  // Structured content comes back untouched from `raw`, the same way the
  // pricing page reads `pricing.faq.items`.
  const sections = tDoc.raw("sections") as LegalSection[];
  const keyPoints = tDoc.raw("keyPoints") as LegalKeyPoint[];
  const minutes = estimateReadingMinutes(sections);

  const entries: TocEntry[] = sections.map((s) => ({
    id: s.id,
    title: s.title,
  }));

  const otherSlug: LegalSlug = slug === "privacy" ? "terms" : "privacy";

  return (
    <main className="relative min-h-screen">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden pt-32 pb-12">
        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <SectionLabel text={tDoc("eyebrow")} color="gold" />

          <h1 className="mt-5 font-playfair text-4xl font-black leading-tight text-primary lg:text-5xl">
            {tDoc("title")}
          </h1>

          <p className="mt-4 max-w-2xl text-[15.5px] leading-[1.75] text-secondary">
            {tDoc("description")}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-edge pt-6">
            <MetaItem
              icon={CalendarClock}
              label={t("effective")}
              value={formatDate(LEGAL_CONFIG.effectiveDate, locale)}
            />
            <MetaItem
              icon={RefreshCw}
              label={t("lastUpdated")}
              value={formatDate(LEGAL_CONFIG.lastUpdated, locale)}
            />
            <MetaItem
              icon={Clock3}
              label={t("readingTime")}
              value={t("minutes", { minutes })}
            />
          </div>
        </div>
      </header>

      {/* ── Key points ───────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-7xl px-6 pb-14">
        <h2 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-faint">
          {t("keyPoints")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {keyPoints.map((point) => (
            <KeyPointCard key={point.title} point={point} />
          ))}
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-muted">
          {t("summaryNote")}
        </p>
      </section>

      {/* ── Document ─────────────────────────────────────────────────────── */}
      <LegalShell entries={entries}>
        <article className="space-y-14">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-heading`}
              className="scroll-mt-28"
            >
              <h2
                id={`${section.id}-heading`}
                className="group mb-5 flex items-center gap-2.5 font-playfair text-2xl font-bold text-primary"
              >
                <span>{section.title}</span>
                <a
                  href={`#${section.id}`}
                  aria-label={t("anchorLabel", { section: section.title })}
                  className="text-muted opacity-0 transition-opacity hover:text-gold focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Link2 size={15} />
                </a>
              </h2>
              <LegalBlocks blocks={section.blocks} locale={locale} />
            </section>
          ))}
        </article>

        {/* ── Questions + cross-link ─────────────────────────────────────── */}
        <div className="mt-16 grid gap-4 border-t border-edge pt-10 sm:grid-cols-2">
          <div className="glass-gold rounded-2xl border border-gold/15 p-6">
            <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-gold/20 bg-gold/10 text-gold">
              <Mail size={17} />
            </span>
            <p className="mb-1.5 text-[15px] font-bold text-primary">
              {t("questionsTitle")}
            </p>
            <p className="mb-4 text-[13.5px] leading-[1.65] text-secondary">
              {t("questionsBody")}
            </p>
            <a
              href={`mailto:${
                slug === "privacy"
                  ? LEGAL_CONFIG.contact.privacy
                  : LEGAL_CONFIG.contact.legal
              }`}
              dir="ltr"
              className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-gold underline decoration-gold/30 underline-offset-4 hover:decoration-gold"
            >
              {slug === "privacy"
                ? LEGAL_CONFIG.contact.privacy
                : LEGAL_CONFIG.contact.legal}
            </a>
          </div>

          <Link
            href={legalHref(otherSlug, locale)}
            className="glass group flex flex-col justify-between rounded-2xl border border-edge p-6 no-underline transition-colors hover:border-gold/30"
          >
            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-faint">
                {t("alsoRead")}
              </p>
              <p className="mb-1.5 text-[15px] font-bold text-primary">
                {tOther("title")}
              </p>
              <p className="text-[13.5px] leading-[1.65] text-secondary">
                {tOther("description")}
              </p>
            </div>
            <span className="mt-4 inline-flex items-center gap-2 text-[13.5px] font-semibold text-gold">
              {t("readDocument")}
              <ArrowRight
                size={15}
                className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
              />
            </span>
          </Link>
        </div>
      </LegalShell>

      <Footer />
    </main>
  );
}
