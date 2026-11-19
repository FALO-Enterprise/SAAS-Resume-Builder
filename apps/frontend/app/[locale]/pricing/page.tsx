import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Plus } from "lucide-react";
import { PLANS } from "@/lib/placeholder-data/plans.placeholder";
import {
  CREDITS_PER_DRAFT,
  PLAN_FACTS,
} from "@/lib/placeholder-data/pricing.placeholder";
import { legalHref } from "@/lib/legal";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import PrimaryAction from "@/components/ui/PrimaryAction";
import PlanTickets from "./PlanTickets";

/* Pricing, in the FALO house system shared with the landing page
   (`app/globals.css`). The plans hang as price tickets, and every figure on
   them comes from `pricing.placeholder.ts`, which mirrors the limits the
   backend enforces. Nothing here may promise more than that file holds. */

const WRAP = "mx-auto w-full max-w-330 px-5 sm:px-8";
const H2 = "lp-display text-[clamp(2rem,4.4vw,3.75rem)]";
const BODY = "text-[17px] leading-[1.65] text-lp-ink2";

type TermItem = { title: string; desc: string };
type FaqItem = { q: string; a: string };

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pricing" });
  const tAction = await getTranslations({ locale, namespace: "cta.button" });
  const tHero = await getTranslations({ locale, namespace: "hero" });
  const tCta = await getTranslations({ locale, namespace: "cta" });

  const terms = t.raw("terms.items") as TermItem[];
  const faq = t.raw("faq.items") as FaqItem[];

  /* One mark per AI draft a plan's credits cover. The longest tape sets the
     scale, so the three tapes can be compared by length. */
  const tapes = PLANS.map((plan) => {
    const credits = PLAN_FACTS[plan.id].credits;
    return {
      id: plan.id,
      name: t(`plans.items.${plan.id}.name`),
      credits,
      drafts: Math.floor(credits / CREDITS_PER_DRAFT),
    };
  });
  const longest = Math.max(...tapes.map((tape) => tape.drafts));

  return (
    <main className="lp relative z-10 overflow-x-clip">
      <Navbar />

      {/* ── Opening ────────────────────────────────────────────────────── */}
      <section className="pb-14 pt-32 sm:pb-16 sm:pt-36">
        <div className={`${WRAP} grid gap-6 lg:grid-cols-[7fr_5fr] lg:items-end lg:gap-16`}>
          <h1 className="lp-display text-[clamp(2.5rem,5.2vw,4.5rem)]">
            {t("hero.title")}
          </h1>
          <div>
            <p className={`${BODY} text-[19px]`}>{t("hero.lead")}</p>
            <p className="lp-label mt-3 text-lp-ink3">{t("hero.note")}</p>
          </div>
        </div>
      </section>

      {/* ── The tickets ────────────────────────────────────────────────── */}
      <section className="lp-mat pb-20 pt-12 sm:pb-28 lg:pt-14">
        <div className={WRAP}>
          <PlanTickets />
          <p className="mt-8 text-[15px] text-lp-ink">{t("totals")}</p>
        </div>
      </section>

      {/* ── What a credit buys ─────────────────────────────────────────── */}
      <section className="py-24 sm:py-32">
        <div className={WRAP}>
          <div className="grid gap-6 lg:grid-cols-[7fr_5fr] lg:items-end lg:gap-16">
            <h2 className={H2}>{t("credits.title")}</h2>
            <p className={BODY}>
              {t("credits.lead", { cost: CREDITS_PER_DRAFT })}
            </p>
          </div>

          <ul className="mt-14 flex flex-col">
            {tapes.map((tape) => (
              <li
                key={tape.id}
                className="grid gap-x-8 gap-y-3 border-t border-lp-rule-strong py-7 lg:grid-cols-[180px_minmax(0,1fr)_260px] lg:items-center"
              >
                <h3 className="text-[22px] font-bold tracking-[-0.02em] rtl:tracking-normal">
                  {tape.name}
                </h3>
                <div
                  className="flex h-9 gap-0.75"
                  style={{ width: `${(tape.drafts / longest) * 100}%` }}
                  aria-hidden
                >
                  {Array.from({ length: tape.drafts }, (_, i) => (
                    <span
                      key={i}
                      className={`block flex-1 ${i % 5 === 4 ? "bg-lp-ink" : "bg-lp-violet"}`}
                    />
                  ))}
                </div>
                <p className="flex items-baseline gap-3 whitespace-nowrap lg:justify-end">
                  <span className="text-[17px] font-semibold">
                    {t("credits.drafts", { count: tape.drafts })}
                  </span>
                  <span className="lp-mono text-lp-ink3">
                    {t("credits.creditCount", { count: tape.credits })}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Before you pay ─────────────────────────────────────────────── */}
      <section className="bg-lp-soft py-24 sm:py-32">
        <div className={`${WRAP} grid gap-12 lg:grid-cols-[5fr_7fr] lg:gap-20`}>
          <div className="lg:sticky lg:top-28 lg:self-start">
            <h2 className={H2}>{t("terms.title")}</h2>
            <Link
              href={legalHref("terms", locale)}
              className="lp-link mt-6 inline-flex items-center gap-1.5 text-[16px]"
            >
              {t("terms.link")}
              <ArrowRight size={16} aria-hidden className="rtl:-scale-x-100" />
            </Link>
          </div>

          <ul>
            {terms.map((item) => (
              <li
                key={item.title}
                className="border-t border-lp-rule-strong py-8"
              >
                <h3 className="text-[24px] font-bold leading-tight tracking-[-0.03em] rtl:tracking-normal">
                  {item.title}
                </h3>
                <p className="mt-3 max-w-152 text-[16.5px] leading-[1.65] text-lp-ink2">
                  {item.desc}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Questions ──────────────────────────────────────────────────── */}
      <section className="py-24 sm:py-32">
        <div className={`${WRAP} grid gap-12 lg:grid-cols-[5fr_7fr] lg:gap-20`}>
          <h2 className={H2}>{t("faq.title")}</h2>

          <div className="border-b border-lp-rule-strong">
            {faq.map((item) => (
              <details
                key={item.q}
                className="group border-t border-lp-rule-strong"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-[20px] font-bold leading-snug tracking-[-0.02em] rtl:tracking-normal [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <Plus
                    size={22}
                    aria-hidden
                    className="shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-open:rotate-45"
                  />
                </summary>
                <p className="max-w-152 pb-7 text-[16.5px] leading-[1.65] text-lp-ink2">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Close ──────────────────────────────────────────────────────── */}
      <section className="lp-night py-24 sm:py-32">
        <div className={WRAP}>
          <h2 className="lp-display text-[clamp(2.5rem,5.6vw,5rem)]">
            {t("close.title")}
          </h2>
          <p className={`${BODY} mt-6 max-w-120 text-[19px]`}>
            {t("close.lead")}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-5">
            <PrimaryAction
              labels={{
                new: tAction("new"),
                onboarding: tAction("onboarding"),
                dashboard: tAction("dashboard"),
              }}
              note={tHero("note")}
            />
            <Link href={`/${locale}/templates`} className="lp-link text-[16px]">
              {tCta("secondary")}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
