import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { templates as templateCards } from "@/lib/placeholder-data/templates.placeholder";
import type {
  TemplateName,
} from "@/lib/types/landing.types";
import { BODY, H2, WRAP } from "./section-styles";

/* Landing templates section: the six real layouts, with the free one marked. */

export default function TemplatesSection() {
  const t = useTranslations();
  const home = `/${useLocale()}`;
  const tTemplates = useTranslations("templatesPage.templates");
  const templateNames: TemplateName[] = templateCards.map((card) => ({
    id: card.id,
    title: tTemplates(`${card.id}.title`),
    field: tTemplates(`${card.id}.field`),
  }));

  return (
    <section className="py-24 sm:py-32">
      <div className={WRAP}>
        <div className="grid gap-6 lg:grid-cols-[7fr_5fr] lg:items-end lg:gap-16">
          <h2 className={H2}>{t("templates.title")}</h2>
          <div>
            <p className={BODY}>{t("templates.lead")}</p>
            <Link
              href={`${home}/templates`}
              className="lp-link mt-4 inline-flex items-center gap-1.5 text-[16px]"
            >
              {t("templates.browse")}
              <ArrowRight size={16} aria-hidden className="rtl:-scale-x-100" />
            </Link>
          </div>
        </div>

        <ul className="mt-14 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-6">
          {templateCards.map((card, i) => {
            const name = templateNames[i];
            return (
              <li key={card.id}>
                <Link
                  href={`${home}/templates`}
                  className="group block no-underline"
                >
                  <span className="lp-sheet block overflow-hidden transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1.5">
                    <Image
                      src={card.image}
                      alt={t("templates.alt", { name: name.title })}
                      width={420}
                      height={594}
                      sizes="(min-width: 1280px) 200px, (min-width: 768px) 30vw, 46vw"
                      className="block h-auto w-full"
                    />
                  </span>
                  <span className="mt-4 block text-[16px] font-bold leading-tight tracking-[-0.02em] text-lp-ink rtl:tracking-normal">
                    {name.title}
                  </span>
                  <span className="lp-label mt-1 block text-lp-ink3">
                    {name.field}
                  </span>
                  {card.id === "minimal" && (
                    <span className="lp-label mt-2 inline-block bg-lp-mat px-1.5 py-0.5 text-lp-ink">
                      {t("templates.free")}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
