"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import SectionLabel from "../ui/SectionLabel";
import { usePreferences } from "@/context/PreferencesContext";

const ease = [0.16, 1, 0.3, 1] as const;

const CITATIONS = ["myth", "parser", "seconds"] as const;

/* Each citation is a sticky card that parks under the navbar while the next one
   slides over it: scrolling past a card shrinks, dims and darkens it, so the
   stack reads as depth rather than as three cards that happen to overlap. The
   card must stay opaque (bg-elevated) or the one underneath shows through. */
function CitationCard({
  citationKey,
  index,
  isLast,
  reduced,
}: {
  citationKey: string;
  index: number;
  isLast: boolean;
  reduced: boolean;
}) {
  const t = useTranslations("evidence");
  const ref = useRef<HTMLLIElement>(null);

  /* "start start" → "end start": progress runs from the card reaching the top
     of the viewport to it having been fully covered. */
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const fade = useTransform(scrollYProgress, [0, 1], [1, 0.35]);
  const dim = useTransform(scrollYProgress, [0, 1], [1, 0.6]);
  const filter = useTransform(dim, (v) => `brightness(${v})`);

  return (
    <motion.li
      ref={ref}
      style={{
        scale: reduced ? 1 : scale,
        /* The last card is never covered, so it never dims. */
        opacity: reduced || isLast ? 1 : fade,
        filter: reduced || isLast ? "none" : filter,
      }}
      initial={{ y: reduced ? 0 : 24 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.45,
        ease,
        delay: reduced ? 0 : index * 0.04,
      }}
      className="sticky top-24 origin-top list-none pb-5 lg:top-28"
    >
      <div className="rounded-2xl border border-edge bg-elevated p-6 shadow-[0_24px_60px_-30px_var(--shadow-color)] sm:p-8">
        <h3 className="max-w-[26ch] font-playfair text-2xl leading-snug font-bold text-balance text-primary lg:text-3xl">
          {t(`items.${citationKey}.finding`)}
        </h3>

        <p className="mt-4 max-w-[62ch] leading-relaxed text-secondary">
          {t(`items.${citationKey}.statement`)}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
          <p className="text-[13px] text-secondary tabular-nums">
            <bdi>{t(`items.${citationKey}.provenance`)}</bdi>
          </p>

          <a
            href={t(`items.${citationKey}.href`)}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex min-h-11 items-center gap-1 text-[13px] font-semibold text-primary underline decoration-edge-strong underline-offset-4 transition-colors hover:decoration-current focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-base focus-visible:outline-none"
          >
            {t(`items.${citationKey}.linkLabel`)}
            <ArrowUpRight
              size={14}
              aria-hidden="true"
              className="transition-transform group-hover:-translate-y-0.5"
            />
            <span className="sr-only"> ({t("newTab")})</span>
          </a>
        </div>
      </div>
    </motion.li>
  );
}

export default function EvidenceSection() {
  const t = useTranslations("evidence");

  const osReduced = useReducedMotion();
  const { preferences, mounted } = usePreferences();
  const reduced = Boolean(osReduced) || (mounted && preferences.reduceMotion);

  const rise = (delay: number) => ({
    initial: { y: reduced ? 0 : 12 },
    whileInView: { y: 0 },
    viewport: { once: true, amount: 0.35 },
    transition: { duration: 0.28, ease, delay: reduced ? 0 : delay },
  });

  return (
    <section
      id="evidence"
      aria-labelledby="evidence-heading"
      className="section-padding relative"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-soft/50 to-transparent"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* `items-start`, not `items-center`: the stack is taller than the
            heading, and a centred heading would float mid-column. */}
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-8">
          <div className="lg:sticky lg:top-28 lg:col-span-4">
            <SectionLabel text={t("label")} color="teal" />
            <motion.h2
              id="evidence-heading"
              {...rise(0.04)}
              className="mt-5 font-playfair text-4xl leading-tight font-black text-balance rtl:tracking-normal lg:text-5xl"
            >
              <span className="text-primary">{t("title")}</span>
              <br />
              <span className="text-gradient-gold">{t("titleHighlight")}</span>
            </motion.h2>
            <motion.p
              {...rise(0.1)}
              className="mt-6 max-w-sm text-[15px] leading-relaxed text-secondary"
            >
              {t("stance")}
            </motion.p>
          </div>

          <ul className="relative lg:col-span-7 lg:col-start-6">
            {CITATIONS.map((key, i) => (
              <CitationCard
                key={key}
                citationKey={key}
                index={i}
                isLast={i === CITATIONS.length - 1}
                reduced={reduced}
              />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
