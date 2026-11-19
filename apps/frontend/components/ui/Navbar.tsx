"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Moon, Sun, X } from "lucide-react";
import Logo from "@/components/ui/Logo";
import UserAvatarMenu from "@/components/ui/UserAvatarMenu";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

/* The site header, used by every page. From the large breakpoint up it
   always sits on paper, because the landing hero splits into paper and mat
   directly beneath it and the links would otherwise straddle the seam. Its
   copy lives in the `landing.nav` messages. */

export default function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { user, openLogin } = useAuth();
  const { theme, toggleTheme, mounted } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const otherLocale = locale === "en" ? "ar" : "en";
  const switchLocale = () =>
    router.push(pathname.replace(`/${locale}`, `/${otherLocale}`));

  const home = `/${locale}`;
  const links = [
    { label: t("howItWorks"), href: `${home}#how-it-works` },
    { label: t("templates"), href: `${home}/templates` },
    { label: t("principles"), href: `${home}#principles` },
    { label: t("pricing"), href: `${home}/pricing` },
  ];

  const solid = scrolled || open;
  const control =
    "h-11 min-w-11 cursor-pointer items-center justify-center px-2 text-[14px] font-medium text-lp-ink transition-colors duration-200 hover:bg-lp-ink/10";

  const utilities = (
    <>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={t("theme")}
        className={`inline-flex ${control}`}
      >
        {mounted && theme === "dark" ? <Moon size={17} /> : <Sun size={17} />}
      </button>
      <button
        type="button"
        onClick={switchLocale}
        lang={otherLocale}
        className={`inline-flex ${control}`}
      >
        {t("otherLanguage")}
      </button>
    </>
  );

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-300 ${
        solid ? "border-lp-rule bg-lp-paper" : "border-transparent lg:bg-lp-paper"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-4 px-5 sm:px-8">
        <Link href={`/${locale}`} aria-label={t("home")} className="no-underline">
          <Logo />
        </Link>

        <nav className="hidden items-center lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3.5 py-2 text-[14px] font-medium text-lp-ink no-underline transition-colors duration-200 hover:bg-lp-ink/10"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <div className="hidden items-center gap-1 sm:flex">{utilities}</div>
          {user ? (
            <UserAvatarMenu />
          ) : (
            <>
              <button
                type="button"
                onClick={openLogin}
                className={`hidden lg:inline-flex ${control} px-3`}
              >
                {t("signIn")}
              </button>
              <Link
                href={`/${locale}/createaccount`}
                className="lp-tag lp-tag-sm hidden sm:inline-flex"
              >
                {t("getStarted")}
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="lp-mobile-menu"
            aria-label={open ? t("closeMenu") : t("openMenu")}
            className={`inline-flex lg:hidden ${control}`}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div
          id="lp-mobile-menu"
          className="border-t border-lp-rule bg-lp-paper px-5 pb-6 pt-2 lg:hidden"
        >
          <nav className="flex flex-col">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-lp-rule py-4 text-[20px] font-semibold tracking-[-0.02em] text-lp-ink no-underline rtl:tracking-normal"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex items-center gap-1 sm:hidden">{utilities}</div>
          {!user && (
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <Link
                href={`/${locale}/createaccount`}
                onClick={() => setOpen(false)}
                className="lp-tag lp-tag-sm"
              >
                {t("getStarted")}
              </Link>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  openLogin();
                }}
                className="lp-link cursor-pointer bg-transparent text-[15px]"
              >
                {t("signIn")}
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
