'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { LayoutTemplate, Globe2, CheckCircle2, FileText, Monitor, Download } from 'lucide-react';
import SectionLabel from '../ui/SectionLabel';

const featureIcons = [LayoutTemplate, Globe2, CheckCircle2, FileText, Monitor, Download];

const featureColors = [
  {
    iconWrap: 'bg-gold/10 border-gold/15',
    icon: 'text-gold',
    bg: 'from-gold/15 to-transparent',
    border: 'hover:border-gold/30',
    line: 'via-gold',
  },
  {
    iconWrap: 'bg-azure-light/10 border-azure-light/15',
    icon: 'text-azure-light',
    bg: 'from-azure-light/15 to-transparent',
    border: 'hover:border-azure-light/30',
    line: 'via-azure-light',
  },
  {
    iconWrap: 'bg-teal-light/10 border-teal-light/15',
    icon: 'text-teal-light',
    bg: 'from-teal-light/15 to-transparent',
    border: 'hover:border-teal-light/30',
    line: 'via-teal-light',
  },
  {
    iconWrap: 'bg-vilot/10 border-vilot/15',
    icon: 'text-vilot',
    bg: 'from-vilot/15 to-transparent',
    border: 'hover:border-vilot/30',
    line: 'via-vilot',
  },
  {
    iconWrap: 'bg-pink/10 border-pink/15',
    icon: 'text-pink',
    bg: 'from-pink/15 to-transparent',
    border: 'hover:border-pink/30',
    line: 'via-pink',
  },
  {
    iconWrap: 'bg-green-light/10 border-green-light/15',
    icon: 'text-green-light',
    bg: 'from-green-light/15 to-transparent',
    border: 'hover:border-green-light/30',
    line: 'via-green-light',
  },
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
            className="font-playfair text-4xl lg:text-6xl font-black mt-5 leading-tight"
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
                className={`group relative glass rounded-2xl p-7 border border-white/5 ${color.border} transition-all duration-300 overflow-hidden hover:-translate-y-1`}
              >
                {/* Background gradient on hover */}
                <div className={`absolute inset-0 bg-linear-to-br ${color.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 border ${color.iconWrap}`}>
                    <Icon size={22} className={color.icon} />
                  </div>
                  <h3 className="text-white font-bold text-xl mb-3">
                    {t(`items.${key}.title`)}
                  </h3>
                  <p className="text-white/45 text-sm leading-relaxed">
                    {t(`items.${key}.desc`)}
                  </p>
                </div>

                {/* Accent bottom line */}
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-linear-to-r from-transparent ${color.line} to-transparent`} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}