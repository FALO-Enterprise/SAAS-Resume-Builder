'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Shield, Cpu, Minimize2, Globe2, Lock } from 'lucide-react';
import SectionLabel from '../ui/SectionLabel';

const principleIcons = [Shield, Cpu, Minimize2, Globe2, Lock];

const regions = ['USA / Canada', 'Europe (Europass)', 'GCC / Middle East', 'Asia-Pacific', 'Academic CVs'];
const regionFlags = ['🇺🇸', '🇪🇺', '🇦🇪', '🌏', '🎓'];

export default function PrinciplesSection() {
  const t = useTranslations('principles');
  const keys = ['honesty', 'ats', 'relevance', 'cultural', 'privacy'] as const;

  return (
    <section id="principles" className="section-padding relative">
      <div className="absolute inset-0 bg-lonear-to-br from-azure/5 to-teal/5" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left */}
          <div>
            <SectionLabel text={t('label')} color="azure" />
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl lg:text-5xl font-black mt-5 mb-8 leading-tight"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              <span className="text-white">{t('title')}</span>
              <br />
              <span className="text-gradient-gold">{t('titleHighlight')}</span>
            </motion.h2>

            {/* Region Tags */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mb-10"
            >
              <p className="text-white/40 text-sm mb-4 uppercase tracking-wider font-semibold">Regional Support</p>
              <div className="flex flex-wrap gap-2">
                {regions.map((region, i) => (
                  <motion.div
                    key={region}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.07 }}
                    className="glass border border-white/8 rounded-full px-4 py-2 flex items-center gap-2"
                  >
                    <span>{regionFlags[i]}</span>
                    <span className="text-white/70 text-sm font-medium">{region}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Big stat */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="glass-gold rounded-2xl p-6 border border-gold/15"
            >
              <div className="text-5xl font-black text-gradient-gold mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>
                120+
              </div>
              <div className="text-white/60 text-sm">Professionally designed templates covering every region, industry, and experience level.</div>
            </motion.div>
          </div>

          {/* Right — Principles List */}
          <div className="space-y-4">
            {keys.map((key, i) => {
              const Icon = principleIcons[i];
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="group glass rounded-xl p-5 border border-white/5 hover:border-gold/20 transition-all duration-300 flex gap-4 items-start"
                >
                  <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={18} className="text-gold" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base mb-1.5">
                      {t(`items.${key}.title`)}
                    </h3>
                    <p className="text-white/45 text-sm leading-relaxed">
                      {t(`items.${key}.desc`)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
