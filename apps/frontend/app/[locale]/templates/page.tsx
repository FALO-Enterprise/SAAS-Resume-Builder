import { Suspense } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import PrimaryAction from "@/components/ui/PrimaryAction";
import TemplateRack from "./TemplateRack";

/* The templates page, in the FALO house system shared with the landing and
   pricing pages (`app/globals.css`). The six real templates are shown whole on
   the mat; `TemplateRack` owns the filter, the preview and the plan gates.

   Claims here are limited to what the product does. The earlier copy promised
   "100% ATS-optimized", an "ATS Shield Guarantee" and compliance with US, EU
   and UK standards; none of those can be demonstrated, so none is repeated. */

const WRAP = "mx-auto w-full max-w-[1320px] px-5 sm:px-8";
const H2 = "lp-display text-[clamp(2rem,4.4vw,3.75rem)]";
const BODY = "text-[17px] leading-[1.65] text-lp-ink2";

type SharedItem = { title: string; desc: string };

export default async function TemplatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "templatesPage.studio" });
  const tAction = await getTranslations({ locale, namespace: "cta.button" });
  const tHero = await getTranslations({ locale, namespace: "hero" });
  const shared = t.raw("shared.items") as SharedItem[];

  return (
    <main className="lp relative z-10 overflow-x-clip">
      <Navbar />

      {/* ── Opening ────────────────────────────────────────────────────── */}
      <section className="pb-14 pt-32 sm:pb-16 sm:pt-36">
        <div className={`${WRAP} grid gap-6 lg:grid-cols-[7fr_5fr] lg:items-end lg:gap-16`}>
          <h1 className="lp-display text-[clamp(2.5rem,5.2vw,4.5rem)]">
            {t("title")}
          </h1>
          <p className={`${BODY} text-[19px]`}>{t("lead")}</p>
        </div>
      </section>

      {/* ── The rack ───────────────────────────────────────────────────── */}
      <section id="templates-grid" className="lp-mat scroll-mt-16 py-12 sm:py-16">
        <div className={WRAP}>
          {/* `useSearchParams` in the rack needs a boundary to render under. */}
          <Suspense fallback={<div className="min-h-[60vh]" />}>
            <TemplateRack />
          </Suspense>
        </div>
      </section>

      {/* ── What they share ────────────────────────────────────────────── */}
      <section className="py-24 sm:py-32">
        <div className={`${WRAP} grid gap-12 lg:grid-cols-[5fr_7fr] lg:gap-20`}>
          <h2 className={`${H2} lg:sticky lg:top-28 lg:self-start`}>
            {t("shared.title")}
          </h2>
          <ul>
            {shared.map((item) => (
              <li
                key={item.title}
                className="border-t border-lp-rule-strong py-8"
              >
                <h3 className="text-[24px] font-bold leading-tight tracking-[-0.03em] rtl:tracking-normal">
                  {item.title}
                </h3>
                <p className="mt-3 max-w-[38rem] text-[16.5px] leading-[1.65] text-lp-ink2">
                  {item.desc}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Close ──────────────────────────────────────────────────────── */}
      <section className="lp-night py-24 sm:py-32">
        <div className={WRAP}>
          <h2 className="lp-display max-w-[16ch] text-[clamp(2.5rem,5.6vw,5rem)]">
            {t("close2.title")}
          </h2>
          <p className={`${BODY} mt-6 max-w-[30rem] text-[19px]`}>
            {t("close2.lead")}
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
            <Link href={`/${locale}/pricing`} className="lp-link text-[16px]">
              {t("close2.pricing")}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
