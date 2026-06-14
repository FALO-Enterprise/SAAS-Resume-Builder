'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Globe, ChevronDown } from 'lucide-react';
import Logo from '@/components/ui/Logo'
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';



export default function Navbar() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { openLogin, closeModal } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const switchLocale = (newLocale: string) => {
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
    setLangOpen(false);
  };

  const navLinks = [
    { label: t('features'),   href: '#features'    },
    { label: t('howItWorks'), href: '#how-it-works' },
    { label: t('templates'),  href: '#templates'    },
    { label: t('pricing'),    href: `/${locale}/Pricing` },
  ];

  const navStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
    transition: 'all 0.4s ease',
    padding: scrolled ? '12px 0' : '20px 0',
    background: scrolled ? 'rgba(10,11,15,0.85)' : 'transparent',
    backdropFilter: scrolled ? 'blur(20px)' : 'none',
    borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
  };

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={navStyle}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href={`/${locale}`} style={{ textDecoration: 'none' }}><Logo /></Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-9">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: 500, textDecoration: 'none', letterSpacing: '0.02em', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="hidden lg:flex">
          {/* Language switcher */}
          <div className='hidden lg:block' style={{ position: 'relative' }}>
            <button onClick={() => setLangOpen(!langOpen)} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 500, padding: '8px 12px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'all 0.2s' }}>
              <Globe size={14} />
              <span>{locale.toUpperCase()}</span>
              <ChevronDown size={11} style={{ transform: langOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
            </button>
            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }} transition={{ duration: 0.15 }}
                  style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#13141a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden', minWidth: 130, zIndex: 100, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                >
                  {[{ code: 'en', label: 'English' }, { code: 'ar', label: 'العربية' }].map((lang) => (
                    <button key={lang.code} onClick={() => switchLocale(lang.code)} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', fontSize: 13, color: locale === lang.code ? '#f5a623' : 'rgba(255,255,255,0.65)', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {lang.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Sign In ── opens login modal */}
          <button
            onClick={openLogin}
            className="hidden lg:block cursor-pointer text-sm font-medium bg-transparent border-none text-center pb-1 text-white/60 py-2 px-4 delay-100 hover:text-white transition-all"
          >
            {t('signIn')}
          </button>

          {/* ── Get Started ── opens signup modal */}
          <Link
            href={`/${locale}/CreateAccount`}
            className="hidden lg:block flex-1 text-center bg-gold text-ink font-bold text-sm py-2 px-4 rounded-full border-none cursor-pointer hover:bg-gold-light hover:scale-[1.04] transition-all"
          >
            {t('getStarted')}
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            className="lg:hidden text-white"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', background: 'rgba(10,11,15,0.95)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: 500, textDecoration: 'none', padding: '8px 0' }}>
                  {link.label}
                </Link>
              ))}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => switchLocale(locale === 'en' ? 'ar' : 'en')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.6)', fontSize: 13, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9999, padding: '8px 16px', background: 'transparent', cursor: 'pointer' }}>
                  <Globe size={13} />
                  {locale === 'en' ? 'العربية' : 'English'}
                </button>
                <Link
                  href={`/${locale}/CreateAccount`}
                  onClick={closeModal}
                  className="flex-1 text-center bg-gold text-ink font-bold text-sm py-2 px-4 rounded-full border-none cursor-pointer"
                >
                  {t('getStarted')}
                </Link>
              </div>
              <button
                onClick={() => { setMobileOpen(false); openLogin(); }}
                className="cursor-pointer text-sm font-medium bg-transparent border-none text-center pb-1 text-white/50"
              >
                {t('signIn')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
