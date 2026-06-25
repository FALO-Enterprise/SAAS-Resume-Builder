'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import SectionLabel from '../ui/SectionLabel';

type TagKey = 'Current' | 'Upcoming' | 'Future';

const versionColors: Record<TagKey, {
  badgeBg: string;
  badgeText: string;
  border: string;
  glow: string;
}> = {
  Current: {
    badgeBg: '#f5a623',
    badgeText: '#0a0b0f',
    border: '#f5a623',
    glow: '0 0 25px rgba(245,166,35,0.35)',
  },
  Upcoming: {
    badgeBg: 'rgba(59,130,246,0.2)',
    badgeText: '#3b82f6',
    border: 'rgba(59,130,246,0.3)',
    glow: 'none',
  },
  Future: {
    badgeBg: 'var(--bg-card)',
    badgeText: 'var(--text-faint)',
    border: 'var(--edge)',
    glow: 'none',
  },
};

export default function RoadmapSection() {
  const t = useTranslations('roadmap');

  const versionKeys = ['v1', 'v15', 'v2', 'v3'] as const;

  return (
    <section id="roadmap" className="section-padding relative">
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-ink to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <SectionLabel text={t('label')} color="gold" />
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl lg:text-6xl font-black mt-5 leading-tight"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            <span className="text-white">{t('title')}</span>{' '}
            <span className="text-gradient-gold">{t('titleHighlight')}</span>
          </motion.h2>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-8 lg:left-1/2 top-0 bottom-0 w-px bg-linear-to-b from-gold via-azure-light to-ink-muted" />

          <div className="space-y-10">
            {versionKeys.map((vKey, i) => {
              const tagKey = ['Current', 'Upcoming', 'Upcoming', 'Future'][i] as keyof typeof versionColors;
              const style = versionColors[tagKey];
              const features = [
                t(`versions.${vKey}.features.0`),
                t(`versions.${vKey}.features.1`),
                t(`versions.${vKey}.features.2`),
              ];

              const isRight = i % 2 === 0;

              return (
                <motion.div
                  key={vKey}
                  initial={{ opacity: 0, x: isRight ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className={`relative flex items-center ${
                    isRight ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  } gap-8`}
                >
                  {/* Content */}
                  <div className={`flex-1 ps-16 lg:ps-0 ${isRight ? 'lg:pe-12 lg:text-right' : 'lg:ps-12'}`}>
                    <div
                      className='glass rounded-2xl p-6 transition-all duration-300'
                      style={{ border: `1px solid ${style.border}`, boxShadow: style.glow }}
                    >
                      <div className="flex items-center gap-3 mb-4 flex-wrap">
                        <span
                          className={`text-2xl font-black ${tagKey === 'Current' ? 'text-gold' : 'text-white/40'}`}
                          style={{ fontFamily: 'var(--font-playfair)' }}
                        >
                          {t(`versions.${vKey}.version`)}
                        </span>
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full bg-[${style.badgeBg}] text-[${style.badgeText}] border border-[${style.border}]`}
                        >
                          {t(`versions.${vKey}.tag`)}
                        </span>
                      </div>
                      <h3 className="text-white font-bold text-xl mb-1">
                        {t(`versions.${vKey}.name`)}
                      </h3>
                      <p className="text-white/40 text-sm mb-4">{t(`versions.${vKey}.date`)}</p>
                      <div className="flex flex-wrap gap-2">
                        {features.map((f, fi) => (
                          <span
                            key={fi}
                            className="glass text-white/60 text-xs px-3 py-1.5 rounded-full border border-white/8"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Center dot */}
                  <div className="absolute left-8 lg:left-1/2 -translate-x-1/2 z-10">
                    <div
                      className={`w-4 h-4 rounded-full border-2 border-[${style.border}] ${tagKey === 'Current' ? 'bg-gold' : 'bg-ink'} shadow-[${style.glow}]`}
                    />
                  </div>

                  {/* Empty right half for desktop */}
                  <div className="hidden lg:block flex-1" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}