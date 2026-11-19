import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { templates as templateCards } from "@/lib/placeholder-data/templates.placeholder";
import type {
  AnswerSlip,
  SheetCopy,
  TemplateName,
} from "@/lib/types/landing.types";
import PrimaryAction from "@/components/ui/PrimaryAction";
import HeroDiagram from "./HeroDiagram";
import { BODY } from "./section-styles";

/* Landing hero: the offer on paper, and on the mat the working diagram of
   seven answers stitched into one resume. */

export default function HeroSection() {
  const t = useTranslations();
  const isArabic = useLocale() === "ar";
  const sheets = t.raw("sampleResume") as { ltr: SheetCopy; rtl: SheetCopy };
  const slips = t.raw("hero.slips") as AnswerSlip[];
  const tTemplates = useTranslations("templatesPage.templates");
  const templateNames: TemplateName[] = templateCards.map((card) => ({
    id: card.id,
    title: tTemplates(`${card.id}.title`),
    field: tTemplates(`${card.id}.field`),
  }));
  const tAction = useTranslations("cta.button");
  const actionLabels = {
    new: tAction("new"),
    onboarding: tAction("onboarding"),
    dashboard: tAction("dashboard"),
  };

  return (
    <section className="grid lg:min-h-[min(100svh,920px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]">
      <div className="flex flex-col justify-center px-5 pb-10 pt-24 sm:px-8 lg:pb-16 lg:pe-12 lg:ps-[max(2rem,calc((100vw-1320px)/2+2rem))] lg:pt-32">
        <h1 className="lp-display text-[clamp(2.75rem,4.5vw,4.4rem)]">
          <span className="block">{t("hero.titleA")}</span>
          <span className="block">{t("hero.titleB")}</span>
          <span className="block text-lp-violet">{t("hero.titleAccent")}</span>
        </h1>
        <p className={`${BODY} mt-7 max-w-136 text-[19px]`}>
          {t("hero.lead")}
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-5">
          <PrimaryAction labels={actionLabels} note={t("hero.note")} />
          <Link href="#how-it-works" className="lp-link text-[16px]">
            {t("hero.secondary")}
          </Link>
        </div>

      </div>

      <div className="lp-mat relative flex flex-col justify-center px-5 py-10 sm:px-8 lg:pb-14 lg:pt-28">
        <div
          className="lp-ruler absolute inset-x-0 top-0 hidden lg:top-16 lg:block"
          aria-hidden
        />
        <HeroDiagram
          slips={slips}
          templateSlipLabel={t("hero.templateSlip")}
          templates={templateNames}
          sheet={isArabic ? sheets.rtl : sheets.ltr}
          specs={t.raw("hero.specs") as string[]}
          switcherLabel={t("hero.switcher")}
          templateNowLabel={t("hero.templateNow")}
          sampleLabel={t("hero.sample")}
        />
      </div>
    </section>
  );
}
