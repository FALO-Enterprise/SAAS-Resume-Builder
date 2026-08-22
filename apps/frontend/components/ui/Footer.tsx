'use client';

import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { ExternalLink, AtSign, Send, Mail } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { legalHref } from '@/lib/legal';
import { blogHref } from '@/lib/blog';

export default function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();

  const productLinks = ['features', 'howItWorks', 'templates', 'pricing'] as const;
  const companyLinks = ['about', 'blog'] as const;
  const supportLinks = ['help', 'privacy', 'terms'] as const;

  const home = `/${locale}`;

  const linkRoutes: Partial<Record<string, string>> = {
    // Product — landing-page sections live behind anchors, the rest are routes.
    features: `${home}#features`,
    howItWorks: `${home}#how-it-works`,
    templates: `${home}/templates`,
    pricing: `${home}/pricing`,
    // Company
    about: `${home}/about`,
    blog: blogHref(locale),
    // Support
    help: `${home}/help`,
    contact: `${home}/help#contact`,
    privacy: legalHref('privacy', locale),
    terms: legalHref('terms', locale),
  };

  return (
    <footer className="relative border-t border-edge">
      <div className="absolute inset-0 bg-linear-to-b from-transparent to-base" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Logo />
            <p className="text-secondary text-sm leading-relaxed mt-4 max-w-xs">
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
                  className="w-9 h-9 glass rounded-lg flex items-center justify-center text-secondary hover:text-primary hover:border-edge-strong transition-all border border-edge"
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
              <h4 className="text-primary font-bold text-sm uppercase tracking-wider mb-5">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => {
                  const href = linkRoutes[link];
                  return (
                    <li key={link}>
                      {href ? (
                        <Link
                          href={href}
                          className="text-secondary hover:text-primary text-sm transition-colors no-underline"
                        >
                          {t(`links.${link}`)}
                        </Link>
                      ) : (
                        <a href="#" className="text-secondary hover:text-primary text-sm transition-colors">
                          {t(`links.${link}`)}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-edge mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-muted text-sm">
            © 2026 ResuMax · {t('rights')}
          </p>
          <p className="text-muted text-sm flex items-center gap-2">
            <span className="w-4 h-4 bg-linear-to-br from-gold to-gold-dark rounded flex items-center justify-center text-white text-xs font-black">F</span>
            {t('poweredBy')}
          </p>
        </div>
      </div>
    </footer>
  );
}