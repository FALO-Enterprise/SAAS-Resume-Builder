import { useTranslations } from "next-intl";
import { BODY, H2, WRAP } from "./section-styles";

/* Landing principles: five refusals, each with what is never written. */

const REFUSAL_KEYS = ["invent", "pad", "track", "silent", "retain"] as const;

export default function PrinciplesSection() {
  const t = useTranslations();
  const tRefusals = useTranslations("principles.items");

  return (
    <section id="principles" className="scroll-mt-16 bg-lp-soft py-24 sm:py-32">
      <div className={`${WRAP} grid gap-12 lg:grid-cols-[5fr_7fr] lg:gap-20`}>
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className={H2}>{t("principles.title")}</h2>
          <p className={`${BODY} mt-6`}>{t("principles.lead")}</p>
        </div>

        <ol>
          {REFUSAL_KEYS.map((key) => (
            <li
              key={key}
              className="border-t border-lp-rule-strong py-8 first:pt-0 first:border-t-0 lg:first:border-t lg:first:pt-8"
            >
              <h3 className="text-[24px] font-bold leading-tight tracking-[-0.03em] rtl:tracking-normal">
                {tRefusals(`${key}.title`)}
              </h3>
              <p className="mt-3 max-w-152 text-[16.5px] leading-[1.65] text-lp-ink2">
                {tRefusals(`${key}.desc`)}
              </p>
              <p className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="lp-label text-lp-flag">
                  {t(`principles.refusedLabels.${key}`)}
                </span>
                <s className="text-[15px] text-lp-ink2 decoration-lp-flag">
                  {tRefusals(`${key}.refused`)}
                </s>
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
