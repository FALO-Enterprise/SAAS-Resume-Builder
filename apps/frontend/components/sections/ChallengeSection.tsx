"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Columns2,
  PenLine,
  ScanLine,
  Type,
  Wand2,
  XCircle,
} from "lucide-react";
import SectionLabel from "../ui/SectionLabel";
import { usePreferences } from "@/context/PreferencesContext";
import { useAuth } from "@/context/AuthContext";
import { useIsClient } from "@/hooks/useIsClient";
import { hasCompletedOnboarding } from "@/lib/onboarding-storage";

/* ---------------------------------------------------------------------------
   The repair demo

   Two of the three findings are fixed by the builder on its own, because both
   are properties of the template: a single-column layout and a skills list
   written as text. The third is not. Matching wording to a posting needs the
   posting, which only the visitor has.

   So the third finding resolves to "needs your target role", not to a green
   check, and it contributes nothing to the score. The demo therefore lands at
   82 rather than 100, and the gap it leaves is the honest reason to sign up.
   Showing three green checks here would be claiming a fix the product cannot
   perform without input.
--------------------------------------------------------------------------- */

const SCORE_START = 47;
const SCORE_AFTER_LAYOUT = 64;
const SCORE_FINAL = 82;

/** Score at which the meter stops reading as a failure. */
const PASS_THRESHOLD = 70;

const ease = [0.16, 1, 0.3, 1] as const;

/* One accent for the whole section, not four.

   The old grid gave each card its own hue (red/orange/yellow/rose 400). Those
   were picked against a near-black ground and collapse in light theme — the
   yellow chip measures 1.39:1 against `.glass` over `--bg-base`, where 3:1 is
   the floor for a non-text indicator. `pink` and `teal` are two of only four
   tokens in globals.css that clear 3:1 in BOTH themes, and pink-to-teal avoids
   the red/green pairing that colour-deficient vision handles worst. */
const FINDINGS = [
  { key: "columns", Icon: Columns2, outcome: "fixed" },
  { key: "wording", Icon: Type, outcome: "input" },
  { key: "skills", Icon: BarChart3, outcome: "fixed" },
] as const;

type Outcome = (typeof FINDINGS)[number]["outcome"];
type Phase = "idle" | "running" | "done";

/** Decorative bar standing in for resume text. */
function Bar({ className }: { className: string }) {
  return <div className={`rounded-full ${className}`} />;
}

const PIN_TONE: Record<"issue" | Outcome, string> = {
  issue: "border-pink/40 bg-pink/10",
  fixed: "border-teal/50 bg-teal/10",
  input: "border-gold/50 bg-gold/10",
};

/** The numbered markers tying a spot on the artifact to a row in the readout. */
function Pin({
  n,
  tone,
  className = "",
}: {
  n: number;
  tone: "issue" | Outcome;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-black text-primary tabular-nums transition-colors duration-300 ${PIN_TONE[tone]} ${className}`}
    >
      {n}
    </span>
  );
}

export default function ChallengeSection() {
  const t = useTranslations("challenge");
  /* Pulled from the hero namespace on purpose: the CTA revealed at the end of
     the demo must be the same action, worded identically, rather than a second
     competing destination. */
  const tHero = useTranslations("hero");
  const locale = useLocale();

  /* `useReducedMotion` only reads the OS media query, and the reduce-motion
     blocks in globals.css only clamp CSS animations/transitions — neither one
     touches framer-motion, which writes inline transforms via rAF, nor the
     score tween below. So the in-app toggle has to be OR-ed in by hand. */
  const osReduced = useReducedMotion();
  const { preferences, mounted } = usePreferences();
  const reduced = Boolean(osReduced) || (mounted && preferences.reduceMotion);

  /* Auth only exists on the client, and `hasCompletedOnboarding` reads
     localStorage. Deriving href and label from one gate keeps them from
     disagreeing for a tick after hydration — same guard as the hero. */
  const { isVerified, user } = useAuth();
  const isClient = useIsClient();
  const isAuthResolved = isClient && isVerified;
  const isPaidUser =
    isAuthResolved && (user?.planName?.toLowerCase() ?? "free") !== "free";
  const hasOnboarded = isAuthResolved && hasCompletedOnboarding(user?.id);
  const primaryHref = !isAuthResolved
    ? `/${locale}/createaccount`
    : hasOnboarded
      ? `/${locale}/dashboard`
      : `/${locale}/onboarding`;

  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(SCORE_START);
  const [settled, setSettled] = useState(0); // how many findings have resolved
  const [revealed, setRevealed] = useState(false);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const frame = useRef<number | null>(null);

  const stopAll = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  }, []);

  useEffect(() => stopAll, [stopAll]);

  const at = (ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  };

  /* Tween the value and re-render the formatted number, rather than rolling
     each digit on its own timer — independent digits are the thing that reads
     as a slot machine. Ease-out with no overshoot: on a number, an overshoot
     means briefly displaying a score that is false. */
  const tweenScore = (from: number, to: number, duration: number) => {
    const startedAt = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setScore(Math.round(from + (to - from) * eased));
      if (p < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  };

  const runFix = () => {
    if (phase !== "idle") return; // aria-disabled, so the click still lands
    setPhase("running");

    if (reduced) {
      setSettled(FINDINGS.length);
      setScore(SCORE_FINAL);
      setPhase("done");
      return;
    }

    /* Each score step is triggered by a finding resolving and starts slightly
       after it, so the cause visibly precedes the effect. The middle beat moves
       no score — that is the finding the builder cannot fix alone. */
    at(120, () => setSettled(1));
    at(200, () => tweenScore(SCORE_START, SCORE_AFTER_LAYOUT, 500));
    at(760, () => setSettled(2));
    at(1120, () => setSettled(3));
    at(1200, () => tweenScore(SCORE_AFTER_LAYOUT, SCORE_FINAL, 560));
    at(1900, () => setPhase("done"));
  };

  const replay = () => {
    stopAll();
    setPhase("idle");
    setScore(SCORE_START);
    setSettled(0);
  };

  const outcomeOf = (i: number): "issue" | Outcome =>
    settled > i ? FINDINGS[i].outcome : "issue";

  const layoutFixed = outcomeOf(0) === "fixed";
  const skillsFixed = outcomeOf(2) === "fixed";
  const passing = score >= PASS_THRESHOLD;

  /* Motion is transform-only on purpose. framer-motion serialises `initial`
     into the server-rendered style attribute, so an `opacity: 0` here would
     ship the whole section invisible until hydration — the same trap the hero
     was rebuilt to escape. A translate leaves the copy readable without JS.
     (The post-demo CTA is exempt: it only ever mounts after a click.) */
  const rise = (delay: number) => ({
    initial: { y: reduced ? 0 : 24 },
    whileInView: { y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.55, ease, delay: reduced ? 0 : delay },
  });

  return (
    <section
      id="challenge"
      aria-labelledby="challenge-heading"
      className="section-padding relative"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-soft to-transparent" />
        <div
          className={`absolute inset-s-1/2 top-1/2 h-120 w-120 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px] transition-colors duration-700 rtl:translate-x-1/2 ${
            passing ? "bg-teal/5" : "bg-pink/4"
          }`}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel text={t("label")} color="gold" />
          <motion.h2
            id="challenge-heading"
            {...rise(0.05)}
            className="mt-5 font-playfair text-4xl leading-tight font-black text-balance rtl:tracking-normal lg:text-6xl"
          >
            <span className="text-primary">{t("title")}</span>
            <br />
            <span className="text-gradient-gold">{t("titleHighlight")}</span>
          </motion.h2>

          <motion.p
            {...rise(0.12)}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-secondary"
          >
            {t("lead")}
          </motion.p>
        </div>

        <div className="mt-14 grid items-center gap-8 lg:mt-16 lg:grid-cols-12 lg:gap-10">
          {/* The artifact.

              Entirely aria-hidden: every finding it illustrates is restated as
              real text in the readout beside it, so handing a screen reader a
              pile of unlabelled bars would only add noise. It is also
              deliberately abstract — a mocked-up resume for a person who does
              not exist reads as a stock photo and costs more trust than the
              illustration buys. */}
          <motion.div
            {...rise(0.18)}
            aria-hidden="true"
            className="lg:col-span-7"
          >
            <div className="glass relative overflow-hidden rounded-2xl border border-edge p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <Bar className="h-3.5 w-2/5 bg-primary/25" />
                  <div className="mt-2.5 flex items-center gap-2">
                    <Bar className="h-2 w-1/4 bg-primary/15" />
                    <Pin n={2} tone={outcomeOf(1)} />
                  </div>
                </div>
                <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/8" />
              </div>

              <div className="mt-6 h-px w-full bg-edge" />

              <div className="relative mt-6 grid grid-cols-[1fr_1.5fr] gap-5">
                <div className="space-y-2.5">
                  <Bar className="h-2 w-4/5 bg-primary/18" />
                  <Bar className="h-2 w-3/5 bg-primary/12" />
                  <Bar className="h-2 w-11/12 bg-primary/12" />
                  <Bar className="h-2 w-2/3 bg-primary/12" />
                </div>
                <div className="space-y-2.5">
                  <Bar className="h-2 w-11/12 bg-primary/18" />
                  <Bar className="h-2 w-full bg-primary/12" />
                  <Bar className="h-2 w-4/5 bg-primary/12" />
                  <Bar className="h-2 w-5/6 bg-primary/12" />
                </div>

                {/* The reading order a parser actually takes: straight across
                    the gutter instead of down each column. inset-x-0 is
                    direction-neutral, so this needs no RTL counterpart. */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
                  <div
                    className={`border-t border-dashed border-pink/50 transition-opacity duration-500 ${
                      layoutFixed ? "opacity-0" : "opacity-100"
                    }`}
                  />
                  <Pin
                    n={1}
                    tone={outcomeOf(0)}
                    className="absolute -top-2.5 inset-s-0"
                  />
                </div>
              </div>

              {/* Skills: a chart carries no text to parse. Once fixed it
                  cross-fades to the same text bars as the rest of the page. */}
              <div className="relative mt-7 flex h-11 items-end gap-3">
                <div
                  className={`flex h-11 items-end gap-1.5 transition-opacity duration-500 ${
                    skillsFixed ? "opacity-0" : "opacity-40"
                  }`}
                >
                  {["h-3", "h-6", "h-4", "h-9", "h-7", "h-11"].map((h, i) => (
                    <div
                      key={i}
                      className={`w-2.5 rounded-t-sm bg-primary/30 ${h}`}
                    />
                  ))}
                </div>
                <div
                  className={`absolute inset-s-0 bottom-1 flex items-center gap-1.5 transition-opacity duration-500 ${
                    skillsFixed ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <Bar className="h-2 w-14 bg-teal/40" />
                  <Bar className="h-2 w-10 bg-teal/40" />
                  <Bar className="h-2 w-16 bg-teal/40" />
                  <Bar className="h-2 w-8 bg-teal/40" />
                </div>
                <Pin n={3} tone={outcomeOf(2)} className="mb-0.5" />
              </div>
            </div>
          </motion.div>

          {/* The readout. */}
          <motion.div
            {...rise(0.26)}
            onViewportEnter={() => setRevealed(true)}
            className="lg:col-span-5"
          >
            <div
              aria-busy={phase === "running"}
              className={`glass rounded-2xl border p-6 transition-colors duration-500 sm:p-7 ${
                passing ? "border-teal/30" : "border-edge"
              }`}
            >
              <div className="flex items-center gap-2">
                <ScanLine size={15} className="text-gold" aria-hidden="true" />
                <span className="text-xs font-bold tracking-widest text-secondary uppercase">
                  {t("scan.heading")}
                </span>
                <span className="ms-auto rounded-full border border-edge px-2 py-0.5 text-[11px] font-semibold tracking-wide text-secondary uppercase">
                  {t("scan.sample")}
                </span>
              </div>

              {/* Said in the layout at readable size, not in a footnote — an
                  asterisk under an animation does not make the animation
                  honest. */}
              <p className="mt-3 text-sm leading-relaxed text-secondary">
                {t("scan.sampleNote")}
              </p>

              <p className="mt-5 font-playfair text-6xl leading-none font-black text-primary tabular-nums">
                {/* Hidden from assistive tech while it counts: a screen reader
                    would otherwise read whichever value happened to be on
                    screen. The real number is announced once, at the end. */}
                <span aria-hidden="true">{score}%</span>
                <span className="sr-only">
                  {t("scan.scoreLabel")}:{" "}
                  {phase === "done" ? SCORE_FINAL : SCORE_START}%
                </span>
              </p>
              <p className="mt-2 text-sm text-secondary">
                {t("scan.scoreLabel")}
              </p>

              {/* scaleX, never width — width reflows the panel every frame. The
                  origin flips with direction so the bar always fills from the
                  inline start, matching .hero-meter. During the run the tween
                  above already produces every frame, so the transition is set
                  to zero and the bar and the number move as one. */}
              <div
                aria-hidden="true"
                className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-edge"
              >
                <motion.div
                  initial={false}
                  animate={{ scaleX: revealed ? score / 100 : 0 }}
                  transition={
                    phase === "running"
                      ? { duration: 0 }
                      : { duration: reduced ? 0 : 0.85, ease }
                  }
                  className={`h-full w-full origin-left rounded-full transition-colors duration-500 rtl:origin-right ${
                    passing ? "bg-teal" : "bg-pink"
                  }`}
                />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-secondary">
                {phase === "done" ? t("scan.scoreNoteFixed") : t("scan.scoreNote")}
              </p>

              <div className="my-6 h-px w-full bg-edge" />

              <ul className="space-y-5">
                {FINDINGS.map(({ key, Icon }, i) => {
                  const tone = outcomeOf(i);
                  const StateIcon =
                    tone === "fixed"
                      ? CheckCircle2
                      : tone === "input"
                        ? PenLine
                        : XCircle;
                  const tint =
                    tone === "fixed"
                      ? "text-teal"
                      : tone === "input"
                        ? "text-gold"
                        : "text-pink";
                  return (
                    <li key={key} className="flex gap-3.5">
                      <span
                        className={`relative mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors duration-300 ${PIN_TONE[tone]}`}
                      >
                        <Icon size={14} className={tint} aria-hidden="true" />
                        {/* A visual cross-reference to the pin on the artifact,
                            which is itself aria-hidden — so this number means
                            nothing without sight of it. */}
                        <span
                          aria-hidden="true"
                          className="absolute -inset-e-1.5 -top-1.5 inline-flex h-4.5 w-4.5 items-center justify-center rounded-full border border-edge bg-elevated text-[10px] font-black text-primary tabular-nums"
                        >
                          {i + 1}
                        </span>
                      </span>
                      <div className="min-w-0">
                        <h3 className="flex items-center gap-1.5 font-bold text-primary">
                          <StateIcon
                            size={13}
                            className={`shrink-0 transition-colors duration-300 ${tint}`}
                            aria-hidden="true"
                          />
                          {tone === "issue"
                            ? t(`findings.${key}.title`)
                            : t(`findings.${key}.resolvedTitle`)}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-secondary">
                          {tone === "issue"
                            ? t(`findings.${key}.desc`)
                            : t(`findings.${key}.resolvedDesc`)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-7">
                <AnimatePresence mode="wait" initial={false}>
                  {phase === "done" ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: reduced ? 0 : 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: reduced ? 0.15 : 0.3, ease }}
                    >
                      <p className="text-sm leading-relaxed text-secondary">
                        {t("fix.outcome")}
                      </p>
                      {/* Next in DOM order after the trigger, so Tab reaches it
                          without the page stealing focus — moving focus here
                          would turn a status message into a change of context. */}
                      <Link
                        href={primaryHref}
                        className="group mt-4 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-gold px-7 font-bold text-on-gold transition-all duration-200 hover:scale-105 hover:bg-gold-light hover:shadow-[0_0_30px_rgba(245,166,35,0.4)] focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-base focus-visible:outline-none"
                      >
                        {isPaidUser ? tHero("ctaPaid") : tHero("cta")}
                        <ArrowRight
                          size={18}
                          aria-hidden="true"
                          className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                        />
                      </Link>
                      <button
                        type="button"
                        onClick={replay}
                        className="mt-3 inline-flex min-h-11 cursor-pointer items-center rounded-full px-2 text-sm font-semibold text-secondary transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-base focus-visible:outline-none"
                      >
                        {t("fix.replay")}
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="trigger"
                      type="button"
                      onClick={runFix}
                      /* Not `disabled`: that drops the control out of the tab
                         order mid-animation. aria-disabled keeps it focusable
                         and the handler early-returns instead. */
                      aria-disabled={phase === "running"}
                      whileTap={phase === "idle" ? { scale: 0.97 } : undefined}
                      exit={{ opacity: 0 }}
                      transition={{ duration: reduced ? 0 : 0.2, ease }}
                      className="glass inline-flex min-h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-gold/30 px-7 font-bold text-primary transition-all duration-200 hover:border-gold/60 hover:bg-gold/8 focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-base focus-visible:outline-none aria-disabled:cursor-wait"
                    >
                      <Wand2
                        size={17}
                        aria-hidden="true"
                        className={`text-gold ${phase === "running" ? "animate-pulse" : ""}`}
                      />
                      {phase === "running" ? t("fix.running") : t("fix.cta")}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Present from first render so it can announce at all, polite so
                  it never interrupts, and written to exactly once — not per
                  finding and not per counter tick. */}
              <p role="status" aria-live="polite" className="sr-only">
                {phase === "done" ? t("fix.announce") : ""}
              </p>
            </div>
          </motion.div>
        </div>

        {/* The one cited number. */}
        <motion.figure
          {...rise(0.34)}
          className="mx-auto mt-12 max-w-3xl text-center"
        >
          <blockquote className="text-lg leading-relaxed text-pretty text-secondary">
            {t.rich("source", {
              b: (chunks) => (
                <span className="font-bold text-primary">{chunks}</span>
              ),
            })}
          </blockquote>
          <figcaption className="mt-3 text-xs tracking-wide text-secondary">
            {t("sourceCite")}
          </figcaption>
        </motion.figure>

        <div
          aria-hidden="true"
          className="mx-auto mt-16 h-20 w-px bg-linear-to-b from-gold/40 to-transparent"
        />
      </div>
    </section>
  );
}
