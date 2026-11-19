import { useTranslations } from "next-intl";
import type {
  SheetCopy,
} from "@/lib/types/landing.types";
import MiniSheet from "@/components/ui/MiniSheet";
import { BODY, H2, WRAP } from "./section-styles";

/* Landing bilingual section: the same answers as an English sheet and an
   Arabic sheet set right to left. */

export default function BilingualSection() {
  const t = useTranslations();
  const sheets = t.raw("sampleResume") as { ltr: SheetCopy; rtl: SheetCopy };

  return (
    <section className="lp-night py-24 sm:py-32">
      <div className={`${WRAP} grid items-center gap-14 lg:grid-cols-[5fr_7fr] lg:gap-20`}>
        <div>
          <h2 className={H2}>{t("bilingual.title")}</h2>
          <p className={`${BODY} mt-6 max-w-120`}>{t("bilingual.lead")}</p>
        </div>

        <div>
          <div className="grid grid-cols-2 gap-4 sm:gap-8">
            <figure>
              <div className="text-[7.5px] sm:text-[11.5px]">
                <MiniSheet template="global" copy={sheets.ltr} dir="ltr" />
              </div>
              <figcaption className="lp-label mt-3 text-lp-ink2">
                {t("bilingual.ltr")}
              </figcaption>
            </figure>
            <figure>
              <div className="text-[7.5px] sm:text-[11.5px]">
                <MiniSheet template="global" copy={sheets.rtl} dir="rtl" />
              </div>
              <figcaption className="lp-label mt-3 text-lp-ink2">
                {t("bilingual.rtl")}
              </figcaption>
            </figure>
          </div>
          <p className="lp-stitch lp-label mt-6 pt-3 text-center text-lp-ink2">
            {t("bilingual.axis")}
          </p>
        </div>
      </div>
    </section>
  );
}
