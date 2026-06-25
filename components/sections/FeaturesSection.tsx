'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { LayoutTemplate, Globe2, CheckCircle2, FileText, Monitor, Download } from 'lucide-react';
import SectionLabel from '../ui/SectionLabel';

const featureIcons = [LayoutTemplate, Globe2, CheckCircle2, FileText, Monitor, Download];
const featureColors = [
  { accent: '#f5a623', bg: 'from-[#f5a623]/15 to-transparent' },
  { accent: '#3b82f6', bg: 'from-[#3b82f6]/15 to-transparent' },
  { accent: '#14b8a6', bg: 'from-[#14b8a6]/15 to-transparent' },
  { accent: '#a855f7', bg: 'from-[#a855f7]/15 to-transparent' },
  { accent: '#f43f5e', bg: 'from-[#f43f5e]/15 to-transparent' },
  { accent: '#22c55e', bg: 'from-[#22c55e]/15 to-transparent' },
];

export default function FeaturesSection() {
  const t = useTranslations('features');
  const keys = ['templates', 'multiRegion', 'ats', 'coverLetter', 'preview', 'export'] as const;

  return (
    <section id="features" className="section-padding relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-gold/4 blur-40 rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <SectionLabel text={t('label')} color="azure" />
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl lg:text-6xl font-black mt-5 leading-tight font-playfair"
            // style={{ fontFamily: 'var(--font-playfair)' }}
          >
            <span className="text-white">{t('title')}</span>
            <br />
            <span className="text-gradient-gold">{t('titleHighlight')}</span>
          </motion.h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {keys.map((key, i) => {
            const Icon = featureIcons[i];
            const color = featureColors[i];
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={`group relative glass rounded-2xl p-7 border border-white/5 hover:border-[${color.accent}]/30 transition-all duration-300 overflow-hidden hover:-translate-y-1`}
              >
                {/* Background gradient on hover */}
                <div className={`absolute inset-0 bg-linear-to-br ${color.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="relative z-10">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6`}
                    style={{ backgroundColor: `${color.accent}18`, border: `1px solid ${color.accent}25` }}
                  >
                    <Icon size={22} style={{ color: color.accent }} />
                  </div>
                  <h3 className="text-white font-bold text-xl mb-3">
                    {t(`items.${key}.title`)}
                  </h3>
                  <p className="text-white/45 text-sm leading-relaxed">
                    {t(`items.${key}.desc`)}
                  </p>
                </div>

                {/* Accent bottom line */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(to right, transparent, ${color.accent}, transparent)` }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}