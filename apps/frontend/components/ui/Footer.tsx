import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { legalHref } from "@/lib/legal";
import { blogHref } from "@/lib/blog";
import Logo from "@/components/ui/Logo";

/* The site footer, used by every page. */

export default function Footer() {
  const tNav = useTranslations("nav");
  const tFooter = useTranslations("footer");
  const locale = useLocale();
  const home = `/${locale}`;

  const columns = [
    {
      title: tFooter("product"),
      links: [
        { label: tNav("howItWorks"), href: `${home}#how-it-works` },
        { label: tFooter("links.templates"), href: `${home}/templates` },
        { label: tFooter("links.pricing"), href: `${home}/pricing` },
      ],
    },
    {
      title: tFooter("company"),
      links: [
        { label: tFooter("links.about"), href: `${home}/about` },
        { label: tFooter("links.blog"), href: blogHref(locale) },
      ],
    },
    {
      title: tFooter("support"),
      links: [
        { label: tFooter("links.help"), href: `${home}/help` },
        { label: tFooter("links.privacy"), href: legalHref("privacy", locale) },
        { label: tFooter("links.terms"), href: legalHref("terms", locale) },
      ],
    },
  ];

  return (
    <footer className="bg-lp-soft py-16">
      <div className="mx-auto w-full max-w-[1320px] px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[5fr_7fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-[22rem] text-[16px] leading-[1.6] text-lp-ink2">
              {tFooter("tagline")}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h3 className="lp-label text-lp-ink3">{column.title}</h3>
                <ul className="mt-4 flex flex-col gap-3">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-[15.5px] text-lp-ink no-underline hover:underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-lp-rule-strong pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[14px] text-lp-ink2">
            © 2026 Resumax AI · {tFooter("rights")}{" "}
            <a
              href="https://falo.software/"
              target="_blank"
              rel="noopener noreferrer"
              className="lp-link font-medium"
            >
              {tFooter("poweredBy")}
            </a>
          </p>
          <p className="lp-label text-lp-ink3">{tFooter("motto")}</p>
        </div>
      </div>
    </footer>
  );
}
