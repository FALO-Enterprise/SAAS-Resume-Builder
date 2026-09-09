"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePreferences } from "@/context/PreferencesContext";

/* ---------------------------------------------------------------------------
   The eyebrow is shared by five sections, so its defects were page-wide.

   The colour moved off the text. Not one accent token in this theme clears
   4.5:1 against both bases, and this label is 12px — gold measures 9.70 on the
   dark base and 1.84 on the light one, teal-light 7.90 and 2.26. A coloured
   label of this size is therefore illegible in one theme whichever accent it
   picks. The accent now lives in the dot, the border and the fill, where it is
   decoration; the words are `text-primary`, legal in both themes.

   The literals are gone too. `bg-[#f5a623]/10` and friends do not participate
   in the theme swap, so the pill was frozen at its dark-theme appearance.
   --------------------------------------------------------------------------- */

interface SectionLabelProps {
  text: string;
  color?: "gold" | "azure" | "teal";
}

const TONES = {
  gold: { pill: "border-gold/25 bg-gold/10", dot: "bg-gold" },
  azure: {
    pill: "border-azure-light/25 bg-azure-light/10",
    dot: "bg-azure-light",
  },
  teal: { pill: "border-teal/30 bg-teal/10", dot: "bg-teal" },
} as const;

export default function SectionLabel({
  text,
  color = "gold",
}: SectionLabelProps) {
  const tone = TONES[color];

  const osReduced = useReducedMotion();
  const { preferences, mounted } = usePreferences();
  const reduced = Boolean(osReduced) || (mounted && preferences.reduceMotion);

  return (
    <motion.div
      /* Transform-only. An `opacity: 0` here serialises into the server-rendered
         markup, which shipped the eyebrow of five sections invisible until
         hydration. */
      initial={{ y: reduced ? 0 : 10 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: reduced ? 0 : 0.4 }}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold tracking-widest text-primary uppercase ${tone.pill}`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full motion-reduce:animate-none ${tone.dot} animate-pulse`}
      />
      {text}
    </motion.div>
  );
}
