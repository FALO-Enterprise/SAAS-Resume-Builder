'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Globe2, ShieldAlert, Bot } from 'lucide-react';
import SectionLabel from '../ui/SectionLabel';

const icons = [AlertTriangle, Globe2, ShieldAlert, Bot];
const colors = [
  { bg: 'bg-red-500/10', border: 'border-red-500/20', icon: 'text-red-400', glow: 'group-hover:shadow-[0_0_30px_rgba(239,68,68,0.1)]' },
  { bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: 'text-orange-400', glow: 'group-hover:shadow-[0_0_30px_rgba(249,115,22,0.1)]' },
  { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: 'text-yellow-400', glow: 'group-hover:shadow-[0_0_30px_rgba(234,179,8,0.1)]' },
  { bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: 'text-rose-400', glow: 'group-hover:shadow-[0_0_30px_rgba(244,63,94,0.1)]' },
];

export default function ChallengeSection() {
  const t = useTranslations('challenge');

  const items = ['formats', 'standards', 'content', 'ats'] as const;

  return (
    <section id="challenge" className="section-padding relative">
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-soft to-transparent" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <SectionLabel text={t('label')} color="gold" />
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl lg:text-6xl font-black mt-5 leading-tight font-playfair"
          >
            <span className="text-primary">{t('title')}</span>
            <br />
            <span className="text-gradient-gold">{t('titleHighlight')}</span>
          </motion.h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((key, i) => {
            const Icon = icons[i];
            const color = colors[i];
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`group glass rounded-2xl p-6 border ${color.border} transition-all duration-300 ${color.glow} hover:translate-y-1`}
              >
                <div className={`w-12 h-12 ${color.bg} rounded-xl flex items-center justify-center mb-5`}>
                  <Icon size={22} className={color.icon} />
                </div>
                <h3 className="text-primary font-bold text-lg mb-3 leading-tight">
                  {t(`items.${key}.title`)}
                </h3>
                <p className="text-faint text-sm leading-relaxed">
                  {t(`items.${key}.desc`)}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Connector line to next section */}
        <motion.div
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="w-px h-20 bg-linear-to-b from-gold/40 to-transparent mx-auto mt-16 origin-top"
        />
      </div>
    </section>
  );
}