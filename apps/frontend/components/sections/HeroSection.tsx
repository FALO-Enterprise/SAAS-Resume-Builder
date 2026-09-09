"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowRight,
  ChevronDown,
  FileText,
  Languages,
  Layers,
  LayoutTemplate,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useIsClient } from "@/hooks/useIsClient";
import { hasCompletedOnboarding } from "@/lib/onboarding-storage";
import { templates } from "@/lib/placeholder-data/templates.placeholder";
import type { TemplateCard } from "@/lib/types/resume.types";

/* ---------------------------------------------------------------------------
   Motion note

   This section deliberately uses no framer-motion. Its `initial` prop is
   serialised into the server-rendered markup, so the headline and the resume
   sheet used to ship as opacity:0 and only became eligible for Largest
   Contentful Paint once the bundle had hydrated. Everything here animates
   through the `.hero-enter` / `.hero-enter-opaque` classes in globals.css
   instead, which start at first paint and are already clamped by both
   reduce-motion mechanisms — the OS media query and the in-app
   [data-reduce-motion] toggle.
--------------------------------------------------------------------------- */

const PREVIEW_TEMPLATE_IDS = [
  "executive",
  "developer",
  "director",
  "minimal",
] as const;

const BREAKDOWN_KEYS = [
  "impact",
  "keywords",
  "clarity",
  "completeness",
] as const;

type SampleAnalysis = Record<(typeof BREAKDOWN_KEYS)[number], number> & {
  total: number;
};

/* Illustrative figures for the hero preview. The four axes are the same ones
   the AI coach actually returns (see the scoreBreakdown schema in
   gemini-resume-coach.generator.ts), so this shows the real shape of a real
   feature — and the panel states in copy that the numbers are a sample. */
const SAMPLE_ANALYSIS: Record<string, SampleAnalysis> = {
  executive: { total: 96, impact: 97, keywords: 94, clarity: 98, completeness: 95 },
  developer: { total: 93, impact: 90, keywords: 97, clarity: 92, completeness: 93 },
  director: { total: 91, impact: 94, keywords: 88, clarity: 90, completeness: 92 },
  minimal: { total: 94, impact: 89, keywords: 93, clarity: 99, completeness: 95 },
};

const PROOF_POINTS = [
  { key: "ats", Icon: ShieldCheck },
  { key: "formats", Icon: FileText },
  { key: "rtl", Icon: Languages },
  { key: "templates", Icon: Layers },
] as const;

const delay = (ms: number) => ({ "--hero-delay": `${ms}ms` }) as CSSProperties;

/* -------------------------------------------------------------------------- */

function AtsPreview() {
  const t = useTranslations("hero");
  const tTemplates = useTranslations("templatesPage");

  const previewTemplates = useMemo(
    () =>
      PREVIEW_TEMPLATE_IDS.map((id) =>
        templates.find((template) => template.id === id),
      ).filter((template): template is TemplateCard => Boolean(template)),
    [],
  );

  const [activeId, setActiveId] = useState<string>(PREVIEW_TEMPLATE_IDS[0]);

  /* The source sheets are multi-megapixel images. Only the first is fetched up
     front; the rest mount once the visitor signals intent by hovering or
     focusing a chip, so switching feels instant without four cold requests. */
  const [requested, setRequested] = useState<string[]>([
    PREVIEW_TEMPLATE_IDS[0],
  ]);

  const request = (id: string) =>
    setRequested((prev) => (prev.includes(id) ? prev : [...prev, id]));

  const analysis = SAMPLE_ANALYSIS[activeId] ?? SAMPLE_ANALYSIS.executive;

  return (
    <div className="relative mx-auto w-full max-w-sm sm:max-w-md lg:mx-0 lg:ms-auto">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-s-1/2 top-1/2 h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-[100px] rtl:translate-x-1/2" />
      </div>

      {/* Resume sheet — the LCP candidate. Boxed at the true A4 ratio the
          source images actually use, so nothing reflows after decode. */}
      <div
        className="hero-enter-opaque relative aspect-210/297 w-full overflow-hidden rounded-2xl border border-edge bg-elevated shadow-[0_30px_80px_-30px_var(--shadow-color)]"
        style={delay(120)}
      >
        {previewTemplates.map((template) =>
          requested.includes(template.id) ? (
            <Image
              key={template.id}
              src={template.image}
              /* Decorative: the active template's name and field are rendered
                 as visible text directly beneath this stack. */
              alt=""
              fill
              sizes="(max-width: 640px) 88vw, (max-width: 1024px) 44vw, 384px"
              priority={template.id === PREVIEW_TEMPLATE_IDS[0]}
              className={`object-cover object-top transition-opacity duration-500 ${
                template.id === activeId ? "opacity-100" : "opacity-0"
              }`}
            />
          ) : null,
        )}
      </div>

      {/* ATS analysis — overlaps the foot of the sheet */}
      <div
        className="hero-enter glass-gold relative z-10 mx-auto -mt-16 w-[94%] rounded-2xl p-4 shadow-[0_20px_50px_-25px_var(--shadow-color)] sm:-mt-20 sm:p-5"
        style={delay(280)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-gold uppercase">
              <ShieldCheck size={13} aria-hidden="true" />
              {t("preview.heading")}
            </p>
            <p className="mt-1 truncate text-sm font-bold text-primary">
              {tTemplates(`templates.${activeId}.title`)}
            </p>
            <p className="truncate text-xs text-secondary">
              {tTemplates(`templates.${activeId}.field`)}
            </p>
          </div>

          <p className="flex shrink-0 items-baseline gap-0.5">
            <span className="sr-only">{t("preview.scoreLabel")}: </span>
            <span className="font-playfair text-4xl leading-none font-black text-primary tabular-nums">
              {analysis.total}
            </span>
            <span className="text-sm font-bold text-gold">%</span>
          </p>
        </div>

        {/* Label above the bar rather than beside it: the Arabic metric names
            are far longer than the English ones, and a fixed label column
            wrapped them out of alignment. */}
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
          {BREAKDOWN_KEYS.map((key) => (
            <div key={key} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-xs text-secondary">
                  {t(`preview.${key}`)}
                </span>
                <span className="text-xs font-semibold text-primary tabular-nums">
                  {analysis[key]}
                </span>
              </div>

              <span
                aria-hidden="true"
                className="relative block h-1.5 overflow-hidden rounded-full bg-edge"
              >
                {/* Keyed by the active template so React remounts it on a
                    switch and the fill animation replays — the score reads as
                    being re-measured rather than silently swapping. */}
                <span
                  key={activeId}
                  className="hero-meter absolute inset-0 rounded-full bg-linear-to-r from-gold-dark via-gold to-gold-light"
                  style={
                    { "--meter-scale": analysis[key] / 100 } as CSSProperties
                  }
                />
              </span>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs leading-snug text-secondary">
          {t("preview.sampleNote")}
        </p>
      </div>

      {/* Template switcher — real buttons, reachable by Tab, never hover-only */}
      <div
        className="hero-enter mt-5 flex flex-wrap gap-2"
        role="group"
        aria-label={t("preview.groupLabel")}
        style={delay(360)}
      >
        {previewTemplates.map((template) => {
          const Icon = template.icon;
          const isActive = template.id === activeId;

          return (
            <button
              key={template.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => {
                request(template.id);
                setActiveId(template.id);
              }}
              onMouseEnter={() => request(template.id)}
              onFocus={() => request(template.id)}
              className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-base focus-visible:outline-none ${
                isActive
                  ? "border-gold/40 bg-gold/15 text-gold"
                  : "border-edge bg-card text-secondary hover:border-edge-strong hover:text-primary"
              }`}
            >
              <Icon size={14} aria-hidden="true" />
              {tTemplates(`templates.${template.id}.title`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export default function HeroSection() {
  const t = useTranslations("hero");
  const locale = useLocale();

  const { isVerified, user } = useAuth();
  const isClient = useIsClient();

  /* Auth only exists on the client. Href and label are derived from one gate
     so they can never disagree — the label used to flip to the signed-in copy
     while the href still pointed at /createaccount for a tick after hydration,
     which sent a fast click to the wrong page. */
  const isAuthResolved = isClient && isVerified;
  const isPaidUser =
    isAuthResolved && (user?.planName?.toLowerCase() ?? "free") !== "free";
  const hasOnboarded = isAuthResolved && hasCompletedOnboarding(user?.id);

  const primaryHref = !isAuthResolved
    ? `/${locale}/createaccount`
    : hasOnboarded
      ? `/${locale}/dashboard`
      : `/${locale}/onboarding`;

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative flex min-h-dvh items-center justify-center overflow-hidden"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-linear-to-br from-ink via-soft to-ink" />
        <div className="absolute inset-s-1/3 top-0 h-96 w-96 rounded-full bg-gold/5 blur-[100px]" />
        <div className="absolute inset-e-1/4 bottom-1/4 h-80 w-80 rounded-full bg-azure/8 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pt-28 pb-20">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
          {/* ---------------- LEFT — value proposition ---------------- */}
          <div className="text-center lg:text-start">
            <p
              className="hero-enter inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-1.5 text-xs font-bold tracking-widest text-gold uppercase"
              style={delay(0)}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              {t("badge")}
            </p>

            <h1
              id="hero-heading"
              className="hero-enter-opaque mt-7 mb-6 font-playfair text-[clamp(2.5rem,5.4vw,4.25rem)] leading-[1] font-black tracking-tight text-balance rtl:tracking-normal"
              style={delay(60)}
            >
              <span className="block text-primary">{t("title")}</span>
              <span className="text-gradient-gold block">
                {t("titleHighlight")}
              </span>
            </h1>

            <p
              className="hero-enter mx-auto max-w-xl text-lg leading-relaxed text-secondary lg:mx-0"
              style={delay(150)}
            >
              {t("subtitle")}
            </p>

            <div
              className="hero-enter mt-10 flex flex-wrap justify-center gap-4 lg:justify-start"
              style={delay(220)}
            >
              <Link
                href={primaryHref}
                className="group inline-flex min-h-13 items-center gap-2 rounded-full bg-gold px-7 font-bold text-on-gold transition-all duration-200 hover:scale-105 hover:bg-gold-light hover:shadow-[0_0_30px_rgba(245,166,35,0.4)] focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-base focus-visible:outline-none"
              >
                {isPaidUser ? t("ctaPaid") : t("cta")}
                <ArrowRight
                  size={18}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                />
              </Link>

              <Link
                href={`/${locale}/templates`}
                className="glass inline-flex min-h-13 items-center gap-2 rounded-full border border-edge px-7 font-semibold text-secondary transition-all duration-200 hover:border-edge-strong hover:text-primary focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-base focus-visible:outline-none"
              >
                {/* Not a Play glyph: the old one was mirrored under RTL, which
                    turned "view templates" into a rewind icon in Arabic. */}
                <LayoutTemplate size={17} aria-hidden="true" />
                {t("ctaSecondary")}
              </Link>
            </div>

            {/* Qualitative proof. The previous counters ("50K+ resumes",
                "98% satisfaction") contradicted the pre-launch badge sitting
                directly above them, so they are gone rather than restyled. */}
            <ul
              className="hero-enter mt-12 flex flex-wrap justify-center gap-x-6 gap-y-3 lg:justify-start"
              style={delay(300)}
            >
              {PROOF_POINTS.map(({ key, Icon }) => (
                <li
                  key={key}
                  className="flex items-center gap-2 text-sm text-secondary"
                >
                  <Icon
                    size={15}
                    aria-hidden="true"
                    className="shrink-0 text-gold"
                  />
                  {t(`proof.${key}`)}
                </li>
              ))}
            </ul>
          </div>

          {/* ---------------- RIGHT — live ATS preview ---------------- */}
          <AtsPreview />
        </div>
      </div>

      <p
        className="hero-enter absolute inset-x-0 bottom-8 flex flex-col items-center gap-1 text-secondary"
        style={delay(520)}
      >
        <span className="text-xs tracking-widest uppercase">
          {t("scrollCue")}
        </span>
        <ChevronDown size={16} aria-hidden="true" />
      </p>
    </section>
  );
}
