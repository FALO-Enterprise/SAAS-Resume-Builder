"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import SectionLabel from "../ui/SectionLabel";
import { usePreferences } from "@/context/PreferencesContext";

/* ---------------------------------------------------------------------------
   The deletions

   A principles section can only be as good as its claims are checkable, and
   the previous five were mostly not. "Enforces truthful representation" — a
   prompt asks the model for it, nothing validates a user's own typing.
   "Every template is engineered for machine readability" — no template
   carries any ATS metadata at all. "Region-specific guidance on photos, age,
   marital status" — age and marital status are not fields anywhere in this
   codebase, and no region model exists. So the section was rebuilt around
   what the product REFUSES to do, because a refusal is checkable in a way a
   capability is not, and every one of these five traces to real behaviour:
   the anti-fabrication prompt, the word budgets, an empty dependency list, a
   pair of explicit opt-in call sites, and seven cascading deletes.

   Form. The refused text is the artifact. Each row quotes the line the
   product will not write and strikes it through, which is the one thing a
   commitment section can show rather than assert. The strike is never the
   only signal: the phrase sits in a <del>, and a visually hidden label names
   it for anyone who cannot see a line through a word. Pink carries the strike
   because pink already means "the problem" in ChallengeSection and in the
   Features parse report; this is the same vocabulary, not a new one.

   What is gone: five equal glass cards of icon plus heading plus text — the
   lazy container, and the one arrangement this page uses nowhere else — and
   with them the five most predictable icons in the category, a shield for
   honesty and a lock for privacy among them.

   Nothing has a fixed height. The Arabic runs 63% of the English on the stat
   line and 99% on the privacy line, so any fixed row would read even in one
   locale and ragged in the other.
   --------------------------------------------------------------------------- */

const ease = [0.16, 1, 0.3, 1] as const;

/** Ordered by how much the refusal costs to keep. */
const PRINCIPLE_KEYS = [
  "invent",
  "pad",
  "track",
  "silent",
  "retain",
] as const;

const REGION_KEYS = ["us", "eu", "gcc", "apac", "academic"] as const;

export default function PrinciplesSection() {
  const t = useTranslations("principles");
  /* The region names live in the `features` namespace and this is now their
     only consumer — FeaturesSection moved to its own short column labels when
     it became a comparison table. Keeping the read here is deliberate: it
     leaves one vocabulary for the five regions rather than two. */
  const tFeatures = useTranslations("features");

  const osReduced = useReducedMotion();
  const { preferences, mounted } = usePreferences();
  const reduced = Boolean(osReduced) || (mounted && preferences.reduceMotion);

  /* Transform-only: framer serialises `initial` into the server-rendered
     markup, so an opacity of 0 here would ship the section invisible until
     hydration. */
  const rise = (delay: number) => ({
    initial: { y: reduced ? 0 : 24 },
    whileInView: { y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.55, ease, delay: reduced ? 0 : delay },
  });

  return (
    <section
      id="principles"
      aria-labelledby="principles-heading"
      className="section-padding relative"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-linear-to-br from-azure/5 to-teal/5"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <SectionLabel text={t("label")} color="azure" />
          <motion.h2
            id="principles-heading"
            {...rise(0.08)}
            className="mt-5 font-playfair text-4xl leading-tight font-black text-balance rtl:tracking-normal lg:text-5xl"
          >
            <span className="text-primary">{t("title")}</span>
            <br />
            <span className="text-gradient-gold">{t("titleHighlight")}</span>
          </motion.h2>
        </div>

        {/* `deletions` carries the hover-dim in globals.css: attending to one
            refusal recedes the rest, which is the section's only motion. */}
        <ul className="deletions mt-14 lg:mt-16">
          {PRINCIPLE_KEYS.map((key, i) => (
            <li
              key={key}
              className="grid gap-5 border-t border-edge py-9 lg:grid-cols-12 lg:gap-8 lg:py-11"
            >
              <motion.h3
                {...rise(0.04 + i * 0.06)}
                className="text-2xl font-bold text-balance text-primary lg:col-span-5"
              >
                {t(`items.${key}.title`)}
              </motion.h3>

              <motion.div
                {...rise(0.08 + i * 0.06)}
                className="lg:col-span-6 lg:col-start-7"
              >
                {/* The specimen being struck. `del` carries the semantics, the
                    rule carries the look, and the hidden label carries the
                    meaning for anyone the rule never reaches. */}
                <p className="rounded-lg border border-edge bg-card px-4 py-3">
                  <span className="sr-only">{t("refusedLabel")}: </span>
                  <del className="text-[15px] leading-relaxed text-secondary decoration-pink/70 decoration-2">
                    {t(`items.${key}.refused`)}
                  </del>
                </p>

                <p className="mt-3.5 text-[15px] leading-relaxed text-secondary">
                  {t(`items.${key}.desc`)}
                </p>
              </motion.div>
            </li>
          ))}
        </ul>

        {/* Closing strip: the two claims on this page that survive checking. */}
        <div className="grid gap-10 border-t border-edge pt-10 lg:grid-cols-12 lg:gap-8">
          <motion.div {...rise(0.06)} className="lg:col-span-5">
            <p className="text-sm font-semibold tracking-wider text-secondary uppercase">
              {t("regionsLabel")}
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {REGION_KEYS.map((region) => (
                <li
                  key={region}
                  className="glass rounded-full border border-edge px-4 py-2 text-sm font-medium text-secondary"
                >
                  {tFeatures(`items.multiRegion.regions.${region}`)}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            {...rise(0.12)}
            className="flex items-baseline gap-4 lg:col-span-6 lg:col-start-7"
          >
            {/* Pinned to LTR: a standalone numeral inside an RTL block is a
                number run that bidi is free to reorder. */}
            <span
              dir="ltr"
              className="font-playfair text-5xl leading-none font-black text-primary tabular-nums"
            >
              {t("stat.value")}
            </span>
            <p className="text-[15px] leading-relaxed text-secondary">
              {t("stat.desc")}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
