'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Quote } from 'lucide-react';
import SectionLabel from '../ui/SectionLabel';

const avatarColors = ['from-gold to-gold-dark', 'from-azure to-teal', 'from-vilot to-vilot-light'];

export default function TestimonialsSection() {
  const t = useTranslations('testimonials');

  const testimonials = [0, 1, 2].map((i) => ({
    name: t(`items.${i}.name`),
    role: t(`items.${i}.role`),
    company: t(`items.${i}.company`),
    text: t(`items.${i}.text`),
    region: t(`items.${i}.region`),
  }));

  return (
    <section id="testimonials" className="section-padding relative">
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-ink/80 to-transparent" />
      <div className="absolute top-0 right-0 w-80 h-80 bg-gold-dark/15 blur-3xl rounded-full" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <SectionLabel text={t('label')} color="teal" />
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl lg:text-6xl font-black mt-5 leading-tight"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            <span className="text-white">{t('title')}</span>
            <br />
            <span className="text-gradient-gold">{t('titleHighlight')}</span>
          </motion.h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {testimonials.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className="glass rounded-2xl p-7 border border-white/8 hover:border-white/15 duration-300 group hover:-translate-y-1 flex flex-col"
            >
              {/* Quote icon */}
              <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center mb-6">
                <Quote size={18} className="text-gold" />
              </div>

              {/* Text */}
              <p className="text-white/65 text-base leading-relaxed flex-1 mb-8">
                `{item.text}`
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full bg-linear-to-br ${avatarColors[i]} flex items-center justify-center text-white font-bold text-sm shrink-0`}
                >
                  {item.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <div className="text-white font-semibold text-sm">{item.name}</div>
                  <div className="text-white/40 text-xs truncate">{item.role} · {item.company}</div>
                </div>
                <div className="ms-auto glass text-white/40 text-xs px-2 py-1 rounded-full border border-white/5 shrink-0">
                  {item.region}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}