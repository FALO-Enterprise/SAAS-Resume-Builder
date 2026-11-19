import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { BODY, H2, WRAP } from "./section-styles";

/* Landing evidence: three sourced facts about screening, each with its link. */

const EVIDENCE_KEYS = ["myth", "parser", "seconds"] as const;

export default function EvidenceSection() {
  const t = useTranslations();
  const tEvidence = useTranslations("evidence");

  return (
    <section className="py-24 sm:py-32">
      <div className={WRAP}>
        <div className="grid gap-6 lg:grid-cols-[7fr_5fr] lg:items-end lg:gap-16">
          <h2 className={H2}>{t("evidence.title")}</h2>
          <p className={BODY}>{tEvidence("stance")}</p>
        </div>

        <ul className="mt-14 grid gap-x-10 gap-y-12 lg:grid-cols-3">
          {EVIDENCE_KEYS.map((key) => (
            <li key={key} className="flex flex-col border-t-2 border-lp-ink pt-6">
              <h3 className="text-[22px] font-bold leading-tight tracking-[-0.02em] rtl:tracking-normal">
                {tEvidence(`items.${key}.finding`)}
              </h3>
              <p className="mt-3 flex-1 text-[16px] leading-[1.65] text-lp-ink2">
                {tEvidence(`items.${key}.statement`)}
              </p>
              <p className="lp-label mt-5 text-lp-ink3">
                {tEvidence(`items.${key}.provenance`)}
              </p>
              <a
                href={tEvidence(`items.${key}.href`)}
                target="_blank"
                rel="noopener noreferrer"
                className="lp-link mt-2 inline-flex items-center gap-1 self-start text-[15px]"
              >
                {tEvidence(`items.${key}.linkLabel`)}
                <ArrowUpRight size={15} aria-hidden className="rtl:-scale-x-100" />
                <span className="sr-only">({tEvidence("newTab")})</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
