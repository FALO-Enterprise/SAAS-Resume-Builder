"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Menu, X, Globe } from "lucide-react";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import UserAvatarMenu from "@/components/ui/UserAvatarMenu";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useAuth } from "@/context/AuthContext";
import { usePreferences } from "@/context/PreferencesContext";
import Link from "next/link";

export default function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { user, openLogin, closeModal } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const osReduced = useReducedMotion();
  const { preferences, mounted } = usePreferences();
  const reduced = Boolean(osReduced) || (mounted && preferences.reduceMotion);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const switchLocale = (newLocale: string) => {
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  const home = `/${locale}`;

  const navLinks = [
    {
      label: t("features"),
      href: `${home}#features`,
    },
    {
      label: t("howItWorks"),
      href: `${home}#how-it-works`,
    },
    {
      label: t("templates"),
      href: `${home}/templates`,
    },
    {
      label: t("pricing"),
      href: `${home}/pricing`,
    },
  ];

  return (
    <motion.header
      initial={{ y: reduced ? 0 : -80 }}
      animate={{ y: 0 }}
      transition={{ duration: reduced ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "py-3 border-b border-edge-strong backdrop-blur-xl shadow-sm"
          : "py-5 bg-transparent border-b border-transparent"
      }`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(245,166,35,0.10),transparent_70%)]"
      />

      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href={`/${locale}`} className="no-underline">
          <Logo />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-9">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-secondary text-[14px] font-medium transition-colors delay-200 hover:text-primary no-underline tracking-wide"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Right */}
        <div className="hidden lg:flex items-center gap-3">
          <ThemeToggle />
          {/* Language switcher */}
          <div className="hidden lg:block">
            <LanguageSwitcher />
          </div>

          {/* Render UserAvatarMenu if user is logged in (verified or unverified) */}
          {user ? (
            <div className="hidden lg:block">
              <UserAvatarMenu />
            </div>
          ) : (
            <>
              {/* ── Sign In ── opens login modal */}
              <button
                onClick={openLogin}
                className="hidden lg:block cursor-pointer text-sm font-medium bg-transparent border-none text-center pb-1 text-primary/60 py-2 px-4 delay-100 hover:text-primary transition-all"
              >
                {t("signIn")}
              </button>

              {/* ── Get Started ── opens signup modal */}
              <Link
                href={`/${locale}/createaccount`}
                className="hidden lg:block flex-1 text-center bg-gold text-on-gold font-bold text-sm py-2 px-4 rounded-full border-none cursor-pointer hover:bg-gold-light hover:scale-[1.04] transition-all"
              >
                {t("getStarted")}
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          {user && <UserAvatarMenu />}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            className="text-text-primary"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-edge bg-ink"
          >
            <div className="py-5 px-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-primary/70 text-lg font-medium decoration-0 py-2 px-0"
                >
                  {link.label}
                </Link>
              ))}
              {user && (
                <>
                  <Link
                    href={`/${locale}/dashboard`}
                    onClick={() => setMobileOpen(false)}
                    className="text-primary text-lg font-bold decoration-0 py-2 px-0"
                  >
                    {t("dashboard")}
                  </Link>
                  <Link
                    href={`/${locale}/drafts`}
                    onClick={() => setMobileOpen(false)}
                    className="text-primary text-lg font-bold decoration-0 py-2 px-0"
                  >
                    {t("drafts")}
                  </Link>
                </>
              )}
              <div className="h-px bg-edge my-1 mx-0" />
              <div className="flex gap-3">
                <button
                  onClick={() => switchLocale(locale === "en" ? "ar" : "en")}
                  className="flex items-center gap-1.5 text-primary/60 text-sm border border-edge rounded-full py-2 px-4 bg-transparent cursor-pointer"
                >
                  <Globe size={13} />
                  {locale === "en" ? "العربية" : "English"}
                </button>
                {!user && (
                  <Link
                    href={`/${locale}/createaccount`}
                    onClick={closeModal}
                    className="flex-1 text-center bg-gold text-on-gold font-bold text-sm py-2 px-4 rounded-full border-none cursor-pointer"
                  >
                    {t("getStarted")}
                  </Link>
                )}
              </div>

              {!user && (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    openLogin();
                  }}
                  className="cursor-pointer text-sm font-medium bg-transparent border-none text-center pb-1 text-secondary"
                >
                  {t("signIn")}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
