import { Check, GripVertical } from "lucide-react";
import { useTranslations } from "next-intl";
import { H2, WRAP } from "./section-styles";

/* Landing process: the four stages on one thread, each with a small working
   model of the real screen. */

const STEP_KEYS = ["survey", "build", "tailor", "export"] as const;

type ProcessDemo = {
  question: string;
  prompt: string;
  options: string[];
  sections: string[];
  saved: string;
  purposeLabel: string;
  purposes: string[];
  beforeLabel: string;
  before: string;
  afterLabel: string;
  after: string;
  files: string[];
  page: string;
  controls: string[];
};

export default function HowItWorksSection() {
  const t = useTranslations();
  const tSteps = useTranslations("howItWorks.steps");
  const demo = t.raw("howItWorks.demo") as ProcessDemo;

  /* The four small working models in the process section, in step order. */
  const stepDemos = [
    // Answer: the first onboarding question, with its real options.
    <div key="answer">
      <p className="lp-mono text-lp-ink3">{demo.question}</p>
      <p className="mt-1 text-[15px] font-semibold leading-snug">{demo.prompt}</p>
      <ul className="mt-3 grid grid-cols-2 gap-1.5">
        {demo.options.map((option, i) => (
          <li
            key={option}
            className={`px-2.5 py-2 text-[12.5px] leading-tight ${
              i === 1
                ? "bg-lp-tag font-semibold text-lp-on-tag"
                : "border border-lp-rule-strong"
            }`}
          >
            {option}
          </li>
        ))}
      </ul>
    </div>,
    // Draft: six sections, one lifted mid-drag, and the autosave mark.
    <div key="draft">
      <ul className="flex flex-col gap-1">
        {demo.sections.map((section, i) => (
          <li
            key={section}
            className={`flex items-center gap-2 border px-2 py-1.5 text-[12.5px] ${
              i === 3
                ? "relative z-10 -translate-y-1 translate-x-2 border-lp-violet bg-lp-card font-semibold shadow-(--lp-shadow) rtl:-translate-x-2"
                : "border-lp-rule-strong"
            }`}
          >
            <GripVertical size={13} aria-hidden className="shrink-0 text-lp-ink3" />
            {section}
          </li>
        ))}
      </ul>
      <p className="lp-label mt-2 flex items-center gap-1.5 text-lp-pass">
        <Check size={13} aria-hidden /> {demo.saved}
      </p>
    </div>,
    // Tailor: the same fact, rewritten. Nothing is added that was not said.
    <div key="tailor">
      <p className="lp-label text-lp-ink3">{demo.beforeLabel}</p>
      <p className="mt-1 text-[13.5px] leading-snug text-lp-ink2 line-through decoration-lp-flag">
        {demo.before}
      </p>
      <p className="lp-label mt-4 text-lp-ink3">{demo.afterLabel}</p>
      <p className="mt-1 text-[15px] font-semibold leading-snug">{demo.after}</p>
      <p className="lp-label mt-4 text-lp-ink3">{demo.purposeLabel}</p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {demo.purposes.map((purpose, i) => (
          <li
            key={purpose}
            className={`px-2 py-1 text-[12px] ${
              i === 0
                ? "bg-lp-tag font-semibold text-lp-on-tag"
                : "border border-lp-rule-strong"
            }`}
          >
            {purpose}
          </li>
        ))}
      </ul>
    </div>,
    // Export: the A4 page with its measurements, and the two file formats.
    <div key="export">
      <div className="flex items-stretch gap-4">
        <div
          className="lp-sheet aspect-210/297 w-23 shrink-0 p-2.5"
          aria-hidden
        >
          <span className="lp-bar mb-2.5 w-2/3 bg-[#6e5bc4]!" />
          <span className="lp-bar mb-1.5 w-full" />
          <span className="lp-bar mb-1.5 w-5/6" />
          <span className="lp-bar mb-4 w-3/5" />
          <span className="lp-bar mb-1.5 w-full" />
          <span className="lp-bar w-4/5" />
        </div>
        <ul className="flex min-w-0 flex-1 flex-col justify-between">
          {demo.controls.map((control, i) => (
            <li
              key={control}
              className="flex items-center justify-between gap-2 border-b border-lp-rule py-1.5 text-[12.5px]"
            >
              {control}
              <span
                aria-hidden
                className={`block h-2 ${i === 1 ? "w-2 rounded-full bg-lp-violet" : "w-6 bg-lp-rule-strong"}`}
              />
            </li>
          ))}
        </ul>
      </div>
      <p className="lp-mono mt-3 text-lp-ink3">{demo.page}</p>
      <ul className="mt-2 flex gap-1.5">
        {demo.files.map((file) => (
          <li
            key={file}
            dir="ltr"
            className="lp-mono flex-1 border border-lp-rule-strong px-2 py-1.5 normal-case! tracking-normal!"
          >
            {file}
          </li>
        ))}
      </ul>
    </div>,
  ];

  return (
    <section id="how-it-works" className="lp-mat scroll-mt-16 py-24 sm:py-32">
      <div className={WRAP}>
        <h2 className={`${H2} max-w-[18ch]`}>{t("howItWorks.title")}</h2>

        <div className="relative mt-16">
          <div
            className="lp-thread absolute inset-x-0 top-0 hidden h-0.5 bg-lp-ink xl:block"
            aria-hidden
          />
          <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {STEP_KEYS.map((key, i) => (
              <li key={key} className="relative flex flex-col xl:pt-7">
                <span
                  className="absolute inset-s-6 -top-1.25 hidden size-3 rounded-full border-2 border-lp-ink bg-lp-mat xl:block"
                  aria-hidden
                />
                <div className="flex flex-1 flex-col rounded-lg bg-lp-card p-6 shadow-(--lp-shadow)">
                  <div className="flex min-h-68 flex-col justify-center">
                    {stepDemos[i]}
                  </div>
                  <div className="mt-6 border-t border-lp-rule-strong pt-5">
                    <p className="lp-label text-lp-ink2">
                      {tSteps(`${key}.count`)} {tSteps(`${key}.unit`)}
                    </p>
                    <h3 className="mt-1 text-[24px] font-bold tracking-[-0.03em] rtl:tracking-normal">
                      {tSteps(`${key}.verb`)}
                    </h3>
                    <p className="mt-2 text-[15.5px] leading-[1.6] text-lp-ink2">
                      {tSteps(`${key}.desc`)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
