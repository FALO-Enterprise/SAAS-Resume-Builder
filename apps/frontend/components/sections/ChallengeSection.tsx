import { ArrowRight, Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type {
  Finding,
  ParsedLine,
  SheetCopy,
} from "@/lib/types/landing.types";
import { BODY, H2, WRAP } from "./section-styles";

/* Landing problem section: one resume as designed and as screening software
   reads it, the three losses, and what Resumax AI does about them. */

const FLAG_LETTER = { a: "A", b: "B", c: "C" } as const;

function FlagBadge({ flag }: { flag: "a" | "b" | "c" }) {
  return (
    <span className="lp-mono inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-lp-flag text-[10px]! tracking-normal! text-lp-paper">
      {FLAG_LETTER[flag]}
    </span>
  );
}

export default function ChallengeSection() {
  const t = useTranslations();
  const tEvidence = useTranslations("evidence");
  const isArabic = useLocale() === "ar";
  const sheets = t.raw("sampleResume") as { ltr: SheetCopy; rtl: SheetCopy };
  const localSheet = isArabic ? sheets.rtl : sheets.ltr;
  const parsed = t.raw("challenge.parsed") as ParsedLine[];
  const findings = t.raw("challenge.findings") as Finding[];
  const answers = t.raw("challenge.answers") as string[];

  return (
    <section id="features" className="scroll-mt-16 bg-lp-soft py-24 sm:py-32">
      <div className={WRAP}>
        <div className="grid gap-6 lg:grid-cols-[7fr_5fr] lg:items-end lg:gap-16">
          <h2 className={H2}>{t("challenge.title")}</h2>
          <p className={BODY}>{t("challenge.lead")}</p>
        </div>

        <div className="mt-14 grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          {/* As designed: two columns, skills as dots */}
          <figure className="flex flex-col">
            <figcaption className="lp-label mb-3 text-lp-ink2">
              {t("challenge.designed")}
            </figcaption>
            <div className="lp-sheet flex flex-1 gap-5 p-6 text-[13px] sm:p-8">
              <div className="min-w-0 flex-1">
                <p className="text-[20px] font-bold leading-tight tracking-[-0.02em] rtl:tracking-normal">
                  {localSheet.name}
                </p>
                <p className="mt-4 flex items-baseline justify-between gap-2 font-semibold">
                  {t("challenge.specimen.role")}
                  <span className="lp-mono text-[10px]! opacity-70">
                    {t("challenge.specimen.date")}
                  </span>
                </p>
                <p className="opacity-75">{t("challenge.specimen.company")}</p>
                <p className="mt-2 leading-snug">{t("challenge.specimen.line")}</p>
              </div>
              <div className="w-[38%] shrink-0 border-s border-[#1c18301f] ps-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6e5bc4] rtl:tracking-normal">
                  {localSheet.skills}
                </p>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {localSheet.skillList.slice(0, 3).map((skill, i) => (
                    <li key={skill}>
                      <span className="block leading-tight">{skill}</span>
                      <span className="mt-1 flex gap-1" aria-hidden>
                        {[0, 1, 2, 3, 4].map((dot) => (
                          <span
                            key={dot}
                            className="block size-2 rounded-full"
                            style={{
                              background: dot < 4 - i ? "#6e5bc4" : "#d8d5e3",
                            }}
                          />
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </figure>

          <div
            className="flex items-center justify-center py-1 text-lp-ink lg:px-2 lg:pt-8"
            aria-hidden
          >
            <ArrowRight size={28} className="rotate-90 lg:rotate-0 lg:rtl:-scale-x-100" />
          </div>

          {/* As read: plain text, with the three losses marked */}
          <figure className="flex flex-col">
            <figcaption className="lp-label mb-3 text-lp-ink2">
              {t("challenge.read")}
            </figcaption>
            <div className="lp-night flex-1 rounded-lg p-6 sm:p-8">
              <ol className="flex flex-col gap-2.5">
                {parsed.map((line) => (
                  <li
                    key={line.text}
                    className={`lp-mono flex items-start gap-3 text-[12.5px]! normal-case! tracking-normal! ${
                      line.flag ? "text-lp-ink" : "text-lp-ink2"
                    }`}
                  >
                    {line.flag ? (
                      <FlagBadge flag={line.flag} />
                    ) : (
                      <span className="size-5 shrink-0" aria-hidden />
                    )}
                    <span className="min-w-0 wrap-break-word">{line.text}</span>
                  </li>
                ))}
              </ol>
            </div>
          </figure>
        </div>
        <p className="mt-3 text-[13px] text-lp-ink3">{t("challenge.note")}</p>

        <ul className="mt-12 grid gap-x-10 gap-y-8 md:grid-cols-3">
          {findings.map((finding) => (
            <li key={finding.key} className="border-t border-lp-rule-strong pt-5">
              <h3 className="flex items-center gap-2.5 text-[20px] font-bold tracking-[-0.02em] rtl:tracking-normal">
                <FlagBadge flag={finding.key} />
                {finding.title}
              </h3>
              <p className="mt-2 text-[16px] leading-[1.6] text-lp-ink2">
                {finding.desc}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-16 grid gap-10 border-t border-lp-rule-strong pt-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <div>
            <h3 className="text-[20px] font-bold tracking-[-0.02em] rtl:tracking-normal">
              {t("challenge.answerTitle")}
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {answers.map((answer) => (
                <li key={answer} className="flex items-start gap-2.5 text-[16px] leading-snug">
                  <Check
                    size={18}
                    aria-hidden
                    className="mt-0.5 shrink-0 text-lp-pass"
                  />
                  {answer}
                </li>
              ))}
            </ul>
          </div>
          <figure className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
            <span className="lp-display text-[clamp(3.5rem,7vw,5.5rem)]" dir="ltr">
              {t("challenge.stat")}
            </span>
            <span>
              <blockquote className="max-w-120 text-[19px] leading-normal">
                {t("challenge.statText")}
              </blockquote>
              <figcaption className="lp-label mt-3 text-lp-ink3">
                {t("challenge.statCite")}{" "}
                <a
                  href={t("challenge.statLink")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lp-link whitespace-nowrap"
                >
                  {t("challenge.statLinkLabel")}
                  <span className="sr-only"> ({tEvidence("newTab")})</span>
                </a>
              </figcaption>
            </span>
          </figure>
        </div>
      </div>
    </section>
  );
}
