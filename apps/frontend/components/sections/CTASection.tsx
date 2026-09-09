"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useIsClient } from "@/hooks/useIsClient";
import { usePreferences } from "@/context/PreferencesContext";
import { hasCompletedOnboarding } from "@/lib/onboarding-storage";

/* ---------------------------------------------------------------------------
   The colophon

   This closer used to bring its own permanently-dark ground, because gold
   measured 9.70:1 on ink but only 1.84:1 on the light base, and no gold in the
   palette cleared the 3:1 large-text floor on cream. That is no longer true:
   `.text-gradient-gold` is now re-cut for light theme from deeper ambers
   (#b45309 measures 4.56:1), so the headline is legible on the ordinary page
   ground and the band has nothing left to buy.

   It also cost something. The Navbar is translucent and carries `text-primary`
   — near-black in light theme — so scrolling it over a fixed dark band made
   its own labels vanish. The section follows the theme like every other one
   now, and the navbar stays readable across the whole page.

   What was removed. Five concentric rings rotated on infinite rAF loops behind
   this section, at border-gold/10 — a cost in continuous compositing and in
   WCAG 2.2.2 for a decoration you had to hunt for. Infinite motion belongs to
   loading indicators, not ornament. One static bloom carries the depth now.

   The labels tell the truth about where they go. The button used to read
   "Start Building Free" in all three auth branches, while only one of them
   started building — the others opened a registration form or a survey. Each
   branch now names its own destination, which also stops the closer repeating
   the hero's button word for word.

   What the copy may claim. The subtitle used to say "thousands of
   professionals" on a page whose own hero badge reads "v1.0 Launching Soon",
   and it was the last survivor of the counters HeroSection already deleted for
   that contradiction. It now states the offer the backend actually enforces:
   seven onboarding questions, and a free plan of one draft, one template
   (`minimal`) and one PDF export. The note below it is unchanged because it
   was already true — the FREE subscription is auto-created at registration and
   nothing in the backend implements a trial.
   --------------------------------------------------------------------------- */

const ease = [0.16, 1, 0.3, 1] as const;

export default function CTASection() {
  const t = useTranslations("cta");
  const locale = useLocale();

  const osReduced = useReducedMotion();
  const { preferences, mounted } = usePreferences();
  const reduced = Boolean(osReduced) || (mounted && preferences.reduceMotion);

  /* `useAuth` is gated behind `useIsClient` because the token lives in browser
     storage: reading it during the server render produced a hydration
     mismatch, and every unresolved visitor is treated as logged out. */
  const { isVerified, user } = useAuth();
  const isClient = useIsClient();
  const isAuthResolved = isClient && isVerified;
  const isPaidUser =
    isAuthResolved && (user?.planName?.toLowerCase() ?? "free") !== "free";
  const hasOnboarded = isAuthResolved && hasCompletedOnboarding(user?.id);

  /* Destination and label are derived together so they can never disagree. */
  const [primaryHref, buttonKey] = !isAuthResolved
    ? ([`/${locale}/createaccount`, "new"] as const)
    : hasOnboarded
      ? ([`/${locale}/dashboard`, "dashboard"] as const)
      : ([`/${locale}/onboarding`, "onboarding"] as const);

  /* No `opacity` in any `initial`: framer serialises it into the
     server-rendered style attribute, which would ship the page's closing
     action invisible until hydration. */
  const rise = (delay: number) => ({
    initial: { y: reduced ? 0 : 24 },
    whileInView: { y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: { duration: 0.6, ease, delay: reduced ? 0 : delay },
  });

  return (
    <section
      id="get-started"
      aria-labelledby="cta-heading"
      className="section-padding relative overflow-hidden"
    >
      {/* Marks the closer off from the section above it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-gold/50 to-transparent"
      />

      {/* One static bloom. Depth without a single frame of animation, and
          capped to the section on small screens: at 800x400 it was four
          times the width of a phone viewport, and a 120px blur over that
          area is paint the device spends on pixels it then clips away. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute start-1/2 top-1/2 h-75 w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/8 blur-[120px] rtl:translate-x-1/2 sm:h-100 sm:w-200"
      />

      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <motion.h2
          id="cta-heading"
          {...rise(0)}
          className="font-playfair text-5xl leading-tight font-black text-balance rtl:tracking-normal lg:text-7xl"
        >
          <span className="text-primary">{t("title")}</span>
          <br />
          <span className="text-gradient-gold">{t("titleHighlight")}</span>
        </motion.h2>

        <motion.p
          {...rise(0.12)}
          className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-pretty text-secondary"
        >
          {t("subtitle")}
        </motion.p>

        <motion.div {...rise(0.2)} className="mt-10 flex justify-center">
          <Link
            href={primaryHref}
            className="group flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-gold px-8 py-5 text-lg font-bold text-on-gold transition-all duration-200 hover:scale-105 hover:bg-gold-light hover:shadow-[0_0_40px_rgba(245,166,35,0.5)] focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-base focus-visible:outline-none sm:w-auto"
          >
            {t(`button.${buttonKey}`)}
            <ArrowRight
              size={20}
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
            />
          </Link>
        </motion.div>

        <motion.p {...rise(0.26)} className="mt-5 text-sm text-secondary">
          {isPaidUser ? t("notePaid") : t("note")}
        </motion.p>

        {/* The lesser commitment. A visitor who is not ready to hand over an
            email previously had nowhere to go but the footer. Deliberately a
            link and not a second button — it must not compete with the action
            above it. Template families are one of the few counts on this site
            that survive checking: there are exactly six. */}
        <motion.div {...rise(0.32)} className="mt-6">
          <Link
            href={`/${locale}/templates`}
            className="group inline-flex min-h-11 items-center gap-1.5 text-sm text-secondary underline decoration-current/30 underline-offset-4 transition-colors hover:text-primary hover:decoration-current focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-base focus-visible:outline-none"
          >
            {t("secondary")}
            <ArrowRight
              size={14}
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
            />
          </Link>
        </motion.div>

        <motion.div
          {...rise(0.38)}
          className="mt-14 flex items-center justify-center gap-3"
        >
          <span
            aria-hidden="true"
            className="h-px w-12 bg-edge"
          />
          <span className="text-xs tracking-widest text-secondary uppercase">
            {t("poweredBy")}
          </span>
          <span
            aria-hidden="true"
            className="h-px w-12 bg-edge"
          />
        </motion.div>
      </div>
    </section>
  );
}
