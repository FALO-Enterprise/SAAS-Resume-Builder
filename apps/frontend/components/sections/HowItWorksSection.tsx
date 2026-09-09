"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import SectionLabel from "../ui/SectionLabel";
import { usePreferences } from "@/context/PreferencesContext";

/* ---------------------------------------------------------------------------
   The weighted index

   What this section is for. Every capability it used to describe is now shown
   two sections earlier, so re-selling capability earns nothing. Its own
   headline names the real subject — "From Blank Page to Job-Ready in Minutes"
   — and that subject is sequence, not features. It is also the only section
   that can honestly answer "what will this actually ask of me", which is the
   question a visitor has at this point on the page.

   Sequence without ordinals. The step numerals are gone. They were the most
   expensive typographic gesture available — Playfair at 72px — spent on the
   least informative content on the page, since a reader infers "third" from
   vertical position anyway. Order is now carried three redundant ways, none of
   them a count: ascending type size, ascending weight, and a rule whose LENGTH
   grows 25 / 50 / 75 / 100%. Display size is spent instead on the four real
   countables, which is the one place it buys something.

   Those countables are measured, not asserted: seven onboarding questions,
   six editor sections, seven rewrite purposes, two export formats. Each is a
   fact about the running product rather than a marketing round number, which
   is why none of them is a "+".

   The Arabic ramp is compressed one step (30/36/48/60 against 36/48/60/72).
   Arabic sets optically heavier than Latin at the same pixel size, so an
   identical ramp reads as shouting in one locale and speaking in the other,
   and the weight axis carries proportionally more of the ascent there.
   Playfair has no Arabic at all, so the verbs are pinned to the Arabic family
   directly rather than being left to fall through Georgia to a system serif.
   --------------------------------------------------------------------------- */

const ease = [0.16, 1, 0.3, 1] as const;

/* Ascending presence. Size and weight both climb, so the ramp survives a
   locale whose display face resolves fewer distinct weights than Playfair's
   400-900 variable axis offers. */
const STEPS = [
  {
    key: "survey",
    size: "text-3xl rtl:text-2xl lg:text-4xl rtl:lg:text-3xl",
    weight: "font-normal",
    rule: "w-1/4",
  },
  {
    key: "build",
    size: "text-4xl rtl:text-3xl lg:text-5xl rtl:lg:text-4xl",
    weight: "font-medium",
    rule: "w-1/2",
  },
  {
    key: "tailor",
    size: "text-5xl rtl:text-4xl lg:text-6xl rtl:lg:text-5xl",
    weight: "font-bold",
    rule: "w-3/4",
  },
  {
    key: "export",
    size: "text-6xl rtl:text-5xl lg:text-7xl rtl:lg:text-6xl",
    weight: "font-black",
    rule: "w-full",
  },
] as const;

export default function HowItWorksSection() {
  const t = useTranslations("howItWorks");

  /* Same contract as Challenge and Features: the CSS reduce-motion blocks
     clamp only CSS animations, and `useReducedMotion` reads only the OS query,
     so neither reaches framer's inline rAF transforms. `mounted` gates the
     in-app toggle because the preferences store answers false on the server. */
  const osReduced = useReducedMotion();
  const { preferences, mounted } = usePreferences();
  const reduced = Boolean(osReduced) || (mounted && preferences.reduceMotion);

  /* Transform-only, never `opacity: 0` — framer serialises `initial` into the
     server-rendered markup, which is how the old version shipped every step
     invisible until hydration. The rules and the spine are deliberately CSS
     rather than framer for the same reason: a `scaleX: 0` initial would ship
     them collapsed and leave them collapsed for anyone whose JS never runs. */
  const rise = (y: number, delay: number) => ({
    initial: { y: reduced ? 0 : y },
    whileInView: { y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: { duration: 0.55, ease, delay: reduced ? 0 : delay },
  });

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="section-padding relative"
    >
      {/* Decorative only, and marked as such: the previous version declared
          neither `pointer-events-none` nor `aria-hidden`. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-soft/60 to-transparent"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="text-center">
          <SectionLabel text={t("label")} color="teal" />
          <motion.h2
            id="how-it-works-heading"
            {...rise(24, 0.08)}
            className="mt-5 font-playfair text-4xl leading-tight font-black text-balance rtl:tracking-normal lg:text-6xl"
          >
            <span className="text-primary">{t("title")}</span>
            <br />
            <span className="text-gradient-gold">{t("titleHighlight")}</span>
          </motion.h2>
        </div>

        {/* A measure, not the full container. Justified across 1232px the
            countable read as unrelated to its verb; on its own column the two
            are one line, and the rule lengths become legible as proportions. */}
        <div className="relative mx-auto mt-14 max-w-3xl lg:mt-20">
          {/* The spine: reading position through the section. Hidden below lg,
              where the steps are already narrow enough that a rail beside them
              would only steal width. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 start-0 hidden w-px bg-edge lg:block"
          >
            <span className="hiw-spine block h-full w-full bg-gold" />
          </div>

          {/* An ordered list, because the order is the content — even though
              nothing here is numbered. */}
          <ol className="lg:ps-12">
            {STEPS.map(({ key, size, weight, rule }, i) => (
              <li key={key} className={i > 0 ? "mt-14 lg:mt-20" : ""}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
                  <motion.h3
                    {...rise(24, i * 0.06)}
                    className={`font-playfair ${size} ${weight} leading-none text-primary rtl:leading-tight rtl:tracking-normal rtl:[font-family:var(--ff-arabic)]`}
                  >
                    {t(`steps.${key}.verb`)}
                  </motion.h3>

                  {/* The evidence, at a fixed size in every row: it is a steady
                      drumbeat under a climbing verb, not a second ramp. */}
                  <motion.p
                    {...rise(24, i * 0.06 + 0.04)}
                    className="flex shrink-0 items-baseline gap-2"
                  >
                    <span className="font-playfair text-3xl leading-none font-black text-primary tabular-nums">
                      {t(`steps.${key}.count`)}
                    </span>
                    <span className="text-xs font-bold tracking-widest text-secondary uppercase">
                      {t(`steps.${key}.unit`)}
                    </span>
                  </motion.p>
                </div>

                <motion.p
                  {...rise(18, i * 0.06 + 0.08)}
                  className="mt-4 max-w-2xl text-[15px] leading-relaxed text-secondary"
                >
                  {t(`steps.${key}.desc`)}
                </motion.p>

                {/* The measurement. Its width is the sequence; the gold draws
                    across it on scroll where the browser supports a timeline,
                    and is simply already drawn where it does not. */}
                <div
                  aria-hidden="true"
                  className={`mt-7 h-px ${rule} bg-edge`}
                >
                  <span className="hiw-rule block h-full w-full bg-gold" />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
