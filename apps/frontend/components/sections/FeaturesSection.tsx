"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { AlertCircle, Check, Minus } from "lucide-react";
import type { ReactNode } from "react";
import SectionLabel from "../ui/SectionLabel";
import { usePreferences } from "@/context/PreferencesContext";
import { templates } from "@/lib/placeholder-data/templates.placeholder";

const ease = [0.16, 1, 0.3, 1] as const;

const SPECIMENS = templates.slice(0, 6);

const ATS_PASS = ["headings", "dates", "contact"] as const;

const REGION_COLS = ["us", "eu", "gcc", "academic"] as const;
const REGION_ROWS: { key: string; inc: readonly boolean[] }[] = [
  { key: "photo", inc: [false, true, true, false] },
  { key: "dob", inc: [false, true, true, false] },
  { key: "onePage", inc: [true, false, false, false] },
  { key: "referees", inc: [false, true, true, true] },
  { key: "publications", inc: [false, false, false, true] },
];

const FORMAT_KEYS = ["pdf", "jpg"] as const;

const PLATES = ["ats", "preview", "coverLetter", "multiRegion"] as const;

const SOON: ReadonlySet<string> = new Set(["coverLetter"]);

export default function FeaturesSection() {
  const t = useTranslations("features");
  const tTemplates = useTranslations("templatesPage");
  const osReduced = useReducedMotion();
  const { preferences, mounted } = usePreferences();
  const reduced = Boolean(osReduced) || (mounted && preferences.reduceMotion);

  const rise = (delay: number) => ({
    initial: { y: reduced ? 0 : 24 },
    whileInView: { y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.55, ease, delay: reduced ? 0 : delay },
  });

  const specimen = (i: number) => ({
    initial: { y: reduced ? 0 : 22, scale: reduced ? 1 : 0.94 },
    whileInView: { y: 0, scale: 1 },
    viewport: { once: true, amount: 0.25 },
    transition: { duration: 0.6, ease, delay: reduced ? 0 : 0.16 + i * 0.06 },
  });

  const atsArtifact = (
    <figure className="glass rounded-2xl border border-edge p-5 shadow-[0_24px_60px_-30px_var(--shadow-color)] sm:p-6">
      <figcaption className="text-xs font-bold tracking-widest text-secondary uppercase">
        {t("plates.ats.caption")}
      </figcaption>

      <ul className="mt-4">
        {ATS_PASS.map((check, i) => (
          <li
            key={check}
            className={`flex items-center gap-3 py-3 ${
              i > 0 ? "border-t border-edge" : ""
            }`}
          >
            <span
              aria-hidden="true"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-teal/50 bg-teal/10"
            >
              <Check size={13} className="text-teal" />
            </span>
            <span className="min-w-0 flex-1 text-[15px] text-primary">
              {t(`plates.ats.pass.${check}`)}
            </span>
            <span className="shrink-0 text-xs text-secondary">
              {t("plates.ats.passLabel")}
            </span>
          </li>
        ))}

        <li className="flex items-center gap-3 border-t border-edge py-3">
          <span
            aria-hidden="true"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-pink/50 bg-pink/10"
          >
            <AlertCircle size={13} className="text-pink" />
          </span>
          <span className="min-w-0 flex-1 text-[15px] text-primary">
            {t("plates.ats.gap")}
          </span>
          <span className="shrink-0 text-xs text-secondary">
            {t("plates.ats.gapLabel")}
          </span>
        </li>
      </ul>

      <p className="mt-4 border-t border-edge pt-4 text-[13px] text-secondary">
        {t("plates.ats.note")}
      </p>
    </figure>
  );

  const previewArtifact = (
    <figure className="glass rounded-2xl border border-edge p-4 shadow-[0_24px_60px_-30px_var(--shadow-color)] sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-edge bg-card p-4">
          <p className="text-xs font-semibold tracking-wide text-secondary uppercase">
            {t("plates.preview.fieldLabel")}
          </p>
          <p className="mt-2 flex items-center text-[15px] font-medium text-primary">
            {t("plates.preview.fieldValue")}
            <span
              aria-hidden="true"
              className="ms-0.5 inline-block h-[1.1em] w-px shrink-0 animate-pulse bg-gold motion-reduce:animate-none"
            />
          </p>
        </div>

        <div className="rounded-xl border border-edge bg-elevated p-4">
          <p className="font-playfair text-lg leading-tight font-black text-primary">
            {t("plates.preview.sheetName")}
          </p>
          <p className="mt-1.5">
            <span className="rounded-[3px] bg-gold/15 px-1.5 py-0.5 text-[13px] font-semibold text-primary">
              {t("plates.preview.fieldValue")}
            </span>
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-secondary">
            {t("plates.preview.sheetLine")}
          </p>
        </div>
      </div>

      <figcaption className="mt-4 text-xs font-bold tracking-widest text-secondary uppercase">
        {t("plates.preview.caption")}
      </figcaption>
    </figure>
  );

  const coverLetterArtifact = (
    <figure className="rounded-2xl border border-edge bg-elevated p-5 shadow-[0_24px_60px_-30px_var(--shadow-color)] sm:p-7">
      <p className="text-[15px] font-semibold text-primary">
        {t("plates.coverLetter.salutation")}
      </p>
      <p className="mt-3 rounded-lg bg-gold/8 p-4 text-[15px] leading-relaxed text-secondary">
        {t("plates.coverLetter.body")}
      </p>
      <figcaption className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-3 py-1.5 text-xs font-bold text-primary">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-gold" />
        {t("plates.coverLetter.matched")}
      </figcaption>
    </figure>
  );

  const regionArtifact = (
    <div
      role="group"
      aria-label={t("plates.region.caption")}
      tabIndex={0}
      className="glass overflow-x-auto rounded-2xl border border-edge shadow-[0_24px_60px_-30px_var(--shadow-color)]"
    >
      <table className="w-full border-collapse text-nowrap">
        <caption className="sr-only">{t("plates.region.caption")}</caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-start text-xs font-bold tracking-widest text-secondary uppercase"
            >
              {t("plates.region.fieldLabel")}
            </th>
            {REGION_COLS.map((col) => (
              <th
                key={col}
                scope="col"
                className="px-2 py-3 text-center text-xs font-bold tracking-widest text-secondary uppercase"
              >
                {t(`plates.region.cols.${col}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {REGION_ROWS.map(({ key, inc }) => (
            <tr key={key} className="border-t border-edge">
              <th
                scope="row"
                className="px-4 py-3.5 text-start text-[15px] font-normal text-primary"
              >
                {t(`plates.region.fields.${key}`)}
              </th>
              {inc.map((included, i) => (
                <td key={REGION_COLS[i]} className="px-2 py-3.5 text-center">
                  {/* Icon plus a screen-reader word: the cell never depends on
                      colour, or on shape, alone. */}
                  <span className="inline-flex items-center justify-center">
                    {included ? (
                      <Check size={16} aria-hidden="true" className="text-teal" />
                    ) : (
                      <Minus size={16} aria-hidden="true" className="text-secondary" />
                    )}
                    <span className="sr-only">
                      {t(
                        included
                          ? "plates.region.included"
                          : "plates.region.omitted",
                      )}
                    </span>
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const ARTIFACTS: Record<(typeof PLATES)[number], ReactNode> = {
    ats: atsArtifact,
    preview: previewArtifact,
    coverLetter: coverLetterArtifact,
    multiRegion: regionArtifact,
  };

  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="section-padding relative"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-s-1/2 top-1/2 h-150 w-150 -translate-x-1/2 -translate-y-1/2 animate-hero-bloom-pulse rounded-full bg-gold/5 blur-[120px] rtl:translate-x-1/2"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="text-center">
          <SectionLabel text={t("label")} color="azure" />
          <motion.h2
            id="features-heading"
            {...rise(0.08)}
            className="mt-5 font-playfair text-4xl leading-tight font-black text-balance rtl:tracking-normal lg:text-6xl"
          >
            <span className="text-primary">{t("title")}</span>
            <br />
            <span className="text-gradient-gold">{t("titleHighlight")}</span>
          </motion.h2>
          <div
            aria-hidden="true"
            className="mx-auto mt-8 h-px w-24 bg-linear-to-r from-transparent via-gold to-transparent"
          />
        </div>

        <motion.div {...rise(0.12)} className="mt-14 lg:mt-20">
          <h3 className="max-w-xl text-2xl font-bold text-primary lg:text-3xl">
            {t("items.templates.title")}
          </h3>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-secondary">
            {t("items.templates.desc")}
          </p>
        </motion.div>

        <figure className="mt-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {SPECIMENS.map((template, i) => (
              <motion.div
                key={template.id}
                {...specimen(i)}
                className="relative aspect-210/297 overflow-hidden rounded-lg bg-card ring-1 ring-edge shadow-[0_14px_34px_-16px_var(--shadow-color)] transition-shadow duration-300 hover:ring-gold/40"
              >
                <Image
                  src={template.image}
                  alt={tTemplates(`templates.${template.id}.title`)}
                  fill
                  sizes="(max-width: 640px) 44vw, (max-width: 1024px) 30vw, 16vw"
                  className="object-contain"
                />
              </motion.div>
            ))}
          </div>
          <figcaption className="mt-4 text-xs font-bold tracking-widest text-secondary uppercase">
            {t("specimenNote")}
          </figcaption>
        </figure>

        <div aria-hidden="true" className="my-14 h-px w-full bg-edge lg:my-20" />
        <div className="flex flex-col gap-16 lg:gap-24">
          {PLATES.map((key, i) => {
            const artifactFirst = i % 2 === 0;
            return (
              <div
                key={key}
                className="grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-0"
              >
                <motion.div
                  {...rise(0.06)}
                  className={
                    artifactFirst
                      ? "lg:col-span-5 lg:col-start-8"
                      : "lg:col-span-5 lg:col-start-1"
                  }
                >
                  <h3 className="text-2xl font-bold text-primary lg:text-3xl">
                    {t(`items.${key}.title`)}
                    {SOON.has(key) && (
                      <span className="ms-3 inline-block rounded-full border border-vilot/30 bg-vilot/10 px-2.5 py-1 align-middle text-[11px] font-bold tracking-widest text-primary uppercase">
                        {t("soonBadge")}
                      </span>
                    )}
                  </h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-secondary">
                    {t(`items.${key}.desc`)}
                  </p>
                </motion.div>

                <motion.div
                  {...rise(0.14)}
                  className={
                    artifactFirst
                      ? "lg:col-span-6 lg:col-start-1 lg:row-start-1"
                      : "lg:col-span-6 lg:col-start-7 lg:row-start-1"
                  }
                >
                  {ARTIFACTS[key]}
                </motion.div>
              </div>
            );
          })}
        </div>

        <div aria-hidden="true" className="my-14 h-px w-full bg-edge lg:my-20" />

        {/* ── Closing band: the exit ── */}
        <motion.div
          {...rise(0.06)}
          className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between lg:gap-12"
        >
          <div className="lg:max-w-md">
            <h3 className="text-2xl font-bold text-primary lg:text-3xl">
              {t("items.export.title")}
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-secondary">
              {t("items.export.desc")}
            </p>
          </div>

          <ul className="flex flex-wrap items-center gap-2.5">
            {FORMAT_KEYS.map((format) => (
              <li
                key={format}
                dir="ltr"
                className="rounded-full border border-edge bg-card px-4 py-2 text-[13px] font-semibold text-primary"
              >
                {t(`items.export.formats.${format}`)}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}

