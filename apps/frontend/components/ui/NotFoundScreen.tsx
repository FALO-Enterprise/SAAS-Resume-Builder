import type { CSSProperties } from "react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, FileSearch, LayoutTemplate } from "lucide-react";
import { FONT_VARIABLES } from "@/app/fonts";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { PREFERENCES_INIT_SCRIPT } from "@/lib/preferences";
import Logo from "@/components/ui/Logo";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

const BOOT_SCRIPT = `${THEME_INIT_SCRIPT}${PREFERENCES_INIT_SCRIPT}`;

const delay = (ms: number) => ({ "--hero-delay": `${ms}ms` }) as CSSProperties;

export default async function NotFoundScreen({
  chrome = false,
}: {
  chrome?: boolean;
}) {
  const locale = await getLocale();
  const t = await getTranslations("notFound");
  const home = `/${locale}`;

  const quickLinks = [
    { href: `${home}/templates`, label: t("links.templates") },
    { href: `${home}/pricing`, label: t("links.pricing") },
    { href: `${home}/blog`, label: t("links.blog") },
    { href: `${home}/help`, label: t("links.help") },
  ];

  return (
    <main
      lang={locale}
      className={`relative flex min-h-screen flex-col overflow-x-hidden bg-base text-primary ${FONT_VARIABLES} ${chrome ? "" : "px-6 py-10"}`}
    >
      <script
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }}
      />

      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,166,35,0.10),transparent_45%)]" />
        <div className="absolute -inset-s-40 top-1/4 h-96 w-96 rounded-full bg-azure/6 blur-3xl" />
        <div className="absolute -inset-e-40 bottom-0 h-96 w-96 rounded-full bg-gold/6 blur-3xl" />
      </div>

      {chrome ? (
        <Navbar />
      ) : (
        <Link
          href={home}
          aria-label="ResuMax"
          className="relative z-10 self-start rounded-lg focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-base focus-visible:outline-none"
        >
          <Logo />
        </Link>
      )}

      <section
        className={`relative z-10 mx-auto flex w-full flex-1 flex-col items-center justify-center text-center ${
          chrome ? "max-w-3xl px-6 pt-36 pb-24" : "max-w-2xl py-16"
        }`}
      >
        <div
          aria-hidden="true"
          className="hero-enter-opaque relative flex items-center justify-center gap-[0.02em] font-playfair text-[clamp(5rem,17vw,9.5rem)] leading-none font-black"
          style={delay(60)}
        >
          <span className="pointer-events-none absolute top-1/2 left-1/2 h-[1.05em] w-[1.6em] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/12 blur-[70px]" />
          <span className="text-gradient-gold relative">4</span>
          <span className="relative mx-[0.04em] grid aspect-square w-[0.74em] place-items-center rounded-full border-[0.045em] border-gold/30">
            <span className="absolute inset-[0.07em] rounded-full bg-gold/8" />
            <FileSearch
              className="relative h-[0.3em] w-[0.3em] text-gold"
              strokeWidth={1.25}
            />
          </span>
          <span className="text-gradient-gold relative">4</span>
        </div>

        <h1
          className="hero-enter-opaque mt-10 font-playfair text-[clamp(1.75rem,4.4vw,2.75rem)] leading-[1.1] font-black tracking-tight text-balance text-primary rtl:tracking-normal"
          style={delay(150)}
        >
          {t("title")}
        </h1>

        <p
          className="hero-enter mx-auto mt-5 max-w-xl text-[16.5px] leading-[1.8] text-secondary"
          style={delay(220)}
        >
          {t("description")}
        </p>

        <div
          className="hero-enter mt-10 flex flex-wrap justify-center gap-4"
          style={delay(300)}
        >
          <Link
            href={home}
            className="group inline-flex min-h-13 items-center gap-2 rounded-full bg-gold px-7 font-bold text-on-gold transition-all duration-200 hover:scale-105 hover:bg-gold-light hover:shadow-[0_0_30px_rgba(245,166,35,0.4)] focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-base focus-visible:outline-none"
          >
            {t("ctaHome")}
            <ArrowRight
              size={18}
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
            />
          </Link>

          <Link
            href={`${home}/templates`}
            className="glass inline-flex min-h-13 items-center gap-2 rounded-full border border-edge px-7 font-semibold text-secondary transition-all duration-200 hover:border-edge-strong hover:text-primary focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-base focus-visible:outline-none"
          >
            {/* Not a chevron: a mirrored one reads as "rewind" in Arabic. */}
            <LayoutTemplate size={17} aria-hidden="true" />
            {t("ctaTemplates")}
          </Link>
        </div>

        {chrome && (
          <nav
            aria-label={t("linksLabel")}
            className="hero-enter mt-14 w-full"
            style={delay(380)}
          >
            <div className="flex items-center gap-4">
              <span className="h-px flex-1 bg-linear-to-r from-transparent to-edge-strong" />
              <span className="text-xs font-bold tracking-widest text-secondary uppercase">
                {t("linksLabel")}
              </span>
              <span className="h-px flex-1 bg-linear-to-l from-transparent to-edge-strong" />
            </div>

            <ul className="mt-6 flex flex-wrap justify-center gap-2.5">
              {quickLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="inline-flex min-h-11 items-center rounded-full border border-edge bg-card px-5 text-sm font-semibold text-secondary transition-colors hover:border-gold/30 hover:bg-card-hover hover:text-primary focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-base focus-visible:outline-none"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </section>

      {chrome && <Footer />}
    </main>
  );
}
