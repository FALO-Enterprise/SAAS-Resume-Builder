import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type {
  AnswerSlip,
} from "@/lib/types/landing.types";
import PrimaryAction from "@/components/ui/PrimaryAction";
import { BODY, WRAP } from "./section-styles";

/* Landing close: the offer, and exactly what the free plan holds. */

export default function CTASection() {
  const t = useTranslations();
  const home = `/${useLocale()}`;
  const plan = t.raw("cta.plan") as AnswerSlip[];
  const tAction = useTranslations("cta.button");
  const actionLabels = {
    new: tAction("new"),
    onboarding: tAction("onboarding"),
    dashboard: tAction("dashboard"),
  };

  return (
    <section className="lp-night py-24 sm:py-36">
      <div className={`${WRAP} grid items-center gap-14 lg:grid-cols-[7fr_5fr] lg:gap-20`}>
        <div>
          <h2 className="lp-display text-[clamp(2.75rem,6vw,5.5rem)]">
            {t("cta.title")}
          </h2>
          <p className={`${BODY} mt-6 max-w-[30rem] text-[19px]`}>
            {t("cta.lead")}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-5">
            <PrimaryAction labels={actionLabels} note={t("hero.note")} />
            <Link href={`${home}/templates`} className="lp-link text-[16px]">
              {t("cta.secondary")}
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-dashed border-lp-rule-strong p-6 sm:p-8">
          <h3 className="text-[20px] font-bold tracking-[-0.02em] rtl:tracking-normal">
            {t("cta.planTitle")}
          </h3>
          <dl className="mt-4">
            {plan.map((entry) => (
              <div
                key={entry.label}
                className="flex items-baseline justify-between gap-4 border-t border-lp-rule py-3"
              >
                <dt className="lp-label text-lp-ink2">{entry.label}</dt>
                <dd className="text-[16px] font-semibold">{entry.value}</dd>
              </div>
            ))}
          </dl>
          <Link
            href={`${home}/pricing`}
            className="lp-link mt-4 inline-flex items-center gap-1.5 text-[15px]"
          >
            {t("cta.pricing")}
            <ArrowRight size={15} aria-hidden className="rtl:-scale-x-100" />
          </Link>
        </div>
      </div>
    </section>
  );
}
