'use client';

import { useTranslations } from 'next-intl';
import { ExternalLink, AtSign, Send, Mail } from 'lucide-react';
import Logo from '@/components/ui/Logo';

export default function Footer() {
  const t = useTranslations('footer');

  const productLinks = ['features', 'templates', 'pricing', 'changelog'] as const;
  const companyLinks = ['about', 'blog', 'careers', 'press'] as const;
  const supportLinks = ['help', 'contact', 'privacy', 'terms'] as const;

  return (
    <footer className="relative border-t border-white/5">
      <div className="absolute inset-0 bg-linear-to-b from-transparent to-ink" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Logo />
            <p className="text-white/40 text-sm leading-relaxed mt-4 max-w-xs">
              {t('tagline')} — {' '}
              Build world-class resumes trusted by professionals in 120+ countries.
            </p>
            {/* Social links */}
            <div className="flex gap-3 mt-6">
              {[
                { icon: ExternalLink, href: '#' },
                { icon: AtSign, href: '#' },
                { icon: Send, href: '#' },
                { icon: Mail, href: 'mailto:hello@resumax.io' },
              ].map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-9 h-9 glass rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all border border-white/5"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {[
            { title: t('product'), links: productLinks },
            { title: t('company'), links: companyLinks },
            { title: t('support'), links: supportLinks },
          ].map(({ title, links }) => (
            <div key={title}>
              <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-5">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-white/40 hover:text-white text-sm transition-colors">
                      {t(`links.${link}`)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/25 text-sm">
            © 2026 ResuMax · {t('rights')}
          </p>
          <p className="text-white/20 text-sm flex items-center gap-2">
            <span className="w-4 h-4 bg-linear-to-br from-gold to-gold-dark rounded flex items-center justify-center text-white text-xs font-black">F</span>
            {t('poweredBy')}
          </p>
        </div>
      </div>
    </footer>
  );
}