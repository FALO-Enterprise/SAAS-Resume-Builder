'use client';

import { motion } from 'framer-motion';
import { useTranslations, useLocale } from "next-intl";
import Link from 'next/link';
import { ArrowRight, Play, Sparkles } from 'lucide-react';

const ResumeMockup = () => (
  <motion.div
    initial={{ opacity: 0, y: 40, rotateY: -10 }}
    animate={{ opacity: 1, y: 0, rotateY: 0 }}
    transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
    className="relative"
    style={{ perspective: 1000 }}
  >
    {/* Glow behind */}
    <div className="absolute inset-0 bg-linear-to-br from-gold/30 via-azure/20 to-transparent blur-3xl rounded-3xl" />

    {/* Main resume card — adapts to theme: lifted charcoal in dark, white paper in light */}
    <motion.div
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      className="relative bg-elevated text-primary rounded-2xl overflow-hidden w-72 shadow-2xl"
    >
      {/* Resume Header — colored band, constant in both themes (white text stays) */}
      <div className="bg-linear-to-br from-azure to-teal p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
            AM
          </div>
          <div>
            <div className="text-white font-bold text-sm">Alex Morgan</div>
            <div className="text-white/70 text-xs">Senior UX Designer</div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <span className="bg-white/15 text-white/90 text-xs px-2 py-0.5 rounded-full">San Francisco</span>
          <span className="bg-gold/30 text-gold text-xs px-2 py-0.5 rounded-full">Open to Work</span>
        </div>
      </div>

      {/* Resume Body */}
      <div className="p-5 space-y-4">
        {/* ATS Score */}
        <div className="flex items-center justify-between">
          <span className="text-secondary text-xs">ATS Score</span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 bg-edge rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '94%' }}
                transition={{ duration: 1.5, delay: 1.2 }}
                className="h-full bg-linear-to-r from-gold to-gold-light rounded-full"
              />
            </div>
            <span className="text-gold text-xs font-bold">94%</span>
          </div>
        </div>

        {/* Experience lines */}
        <div className="space-y-2">
          <div className="text-faint text-xs uppercase tracking-wider font-semibold">Experience</div>
          {[
            { company: 'Meta', role: 'Lead Designer', years: '2021-2024' },
            { company: 'Airbnb', role: 'UX Designer', years: '2018-2021' },
          ].map((exp, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-edge">
              <div>
                <div className="text-primary text-xs font-semibold">{exp.company}</div>
                <div className="text-secondary text-xs">{exp.role}</div>
              </div>
              <div className="text-faint text-xs">{exp.years}</div>
            </div>
          ))}
        </div>

        {/* Skills */}
        <div>
          <div className="text-faint text-xs uppercase tracking-wider font-semibold mb-2">Skills</div>
          <div className="flex flex-wrap gap-1.5">
            {['Figma', 'React', 'Prototyping', 'A/B Testing'].map((s) => (
              <span key={s} className="glass text-secondary text-xs px-2 py-1 rounded-md border border-edge">{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom badge */}
      <div className="px-5 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles size={11} className="text-gold" />
          <span className="text-gold text-xs font-semibold">ResuMax Verified</span>
        </div>
        <div className="w-6 h-6 rounded-full bg-linear-to-br from-gold to-gold-dark flex items-center justify-center">
          <span className="text-white text-xs font-black">R</span>
        </div>
      </div>
    </motion.div>

    {/* Floating badges */}
    <motion.div
      animate={{ y: [0, -6, 0], x: [0, 3, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      className="absolute -top-6 -right-8 glass-gold rounded-xl px-3 py-2 flex items-center gap-2"
    >
      <div className="w-5 h-5 rounded-full bg-gold flex items-center justify-center">
        <span className="text-white text-xs font-bold">✓</span>
      </div>
      <div>
        <div className="text-primary text-xs font-bold">ATS Ready</div>
        <div className="text-secondary text-xs">Global Standard</div>
      </div>
    </motion.div>

    <motion.div
      animate={{ y: [0, 8, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut'}}
      className="absolute -bottom-4 -left-10 glass rounded-xl px-3 py-2 gap-2 transition-delay-100"
    >
      <div className="text-faint text-xs">Templates</div>
      <div className="text-primary font-bold text-lg">120+</div>
    </motion.div>
  </motion.div>
);

const Stat = ({ number, label, delay }: { number: string; label: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    className="text-center lg:text-left"
  >
    <div className="text-3xl lg:text-4xl font-black text-primary font-playfair">
      {number}
    </div>
    <div className="text-faint text-sm mt-1 font-medium tracking-wide">{label}</div>
  </motion.div>
);

export default function HeroSection() {
  const t = useTranslations('hero');
  const locale = useLocale();

  return (
    <section className="relative min-h-screen flex justify-center items-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-ink via-soft to-ink" />
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-gold/5 blur-[100px] rounded-full" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-azure/8 blur-[100px] rounded-full" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-20 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 mb-8"
            >
              <span className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse" />
              <span className="text-gold text-xs font-bold uppercase tracking-widest">{t('badge')}</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl lg:text-7xl font-black leading-[1.05] mb-6 font-playfair"
            >
              <span className="text-primary">{t('title')}</span>
              <br />
              <span className="text-gradient-gold">{t('titleHighlight')}</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-secondary text-lg leading-relaxed max-w-xl mb-10"
            >
              {t('subtitle')}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-4 mb-16"
            >
              <Link
                href="#get-started"
                className="group flex items-center gap-2 bg-gold hover:bg-gold-light text-ink font-bold px-7 py-4 rounded-full transition-all duration-200 hover:scale-105 hover:shadow-[0_0_30px_rgba(245,166,35,0.4)]"
              >
                {t('cta')}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href={`${locale}/templates`}
                className="flex items-center gap-2 glass border border-edge text-secondary hover:text-primary font-semibold px-7 py-4 rounded-full transition-all duration-200 hover:border-edge-strong"
              >
                <Play size={15} className="fill-current" />
                {t('ctaSecondary')}
              </Link>
            </motion.div>

            {/* Stats */}
            <div className="flex flex-wrap gap-10">
              <Stat number={t('stats.resumes')} label={t('stats.resumesLabel')} delay={0.5} />
              <div className="hidden sm:block w-px bg-edge" />
              <Stat number={t('stats.templates')} label={t('stats.templatesLabel')} delay={0.6} />
              <div className="hidden sm:block w-px bg-edge" />
              <Stat number={t('stats.satisfaction')} label={t('stats.satisfactionLabel')} delay={0.7} />
            </div>
          </div>

          {/* Right — Resume Mockup */}
          <div className="flex justify-center lg:justify-end">
            <ResumeMockup />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-muted text-xs tracking-widest uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-0.5 h-8 bg-linear-to-b from-gold/60 to-transparent"
        />
      </motion.div>
    </section>
  );
}