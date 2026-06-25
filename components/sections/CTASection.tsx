'use client';

import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CTASection() {
  const t = useTranslations('cta');
  const locale = useLocale();

  return (
    <section id="get-started" className="section-padding relative overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-linear-to-br from-soft via-ink to-soft" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-100 bg-gold/8 blur-[120px] rounded-full" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-100 h-75 bg-azure/10 blur-[80px] rounded-full" />

      {/* Geometric decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute border border-gold/10 rounded-full"
            style={{
              width: `${200 + i * 150}px`,
              height: `${200 + i * 150}px`,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
            transition={{ duration: 20 + i * 8, repeat: Infinity, ease: 'linear' }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-5xl lg:text-7xl font-black mb-6 leading-tight"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          <span className="text-white">{t('title')}</span>
          <br />
          <span className="text-gradient-gold">{t('titleHighlight')}</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-white/50 text-lg leading-relaxed max-w-2xl mx-auto mb-10"
        >
          {t('subtitle')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link
            href={`/${locale}/CreateAccount`}
            className="group flex items-center gap-2 bg-gold hover:bg-gold-light text-ink font-bold px-8 py-5 rounded-full text-lg transition-all duration-200 hover:scale-105 hover:shadow-[0_0_40px_rgba(245,166,35,0.5)] w-full sm:w-auto justify-center"
          >
            {t('button')}
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-white/25 text-sm mt-5"
        >
          {t('note')}
        </motion.p>

        {/* FALO branding */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-12 flex items-center justify-center gap-2"
        >
          <div className="h-px w-12 bg-white/10" />
          <span className="text-white/25 text-xs uppercase tracking-widest">Powered by FALO Enterprise</span>
          <div className="h-px w-12 bg-white/10" />
        </motion.div>
      </div>
    </section>
  );
}
