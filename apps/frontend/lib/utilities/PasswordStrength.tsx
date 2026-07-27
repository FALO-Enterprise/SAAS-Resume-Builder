'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {  Check } from 'lucide-react';

function PasswordStrength({ password }: { password: string }) {
  const t = useTranslations('auth.signup');
  const checks = [
    { label: t('passwordChecks.length'), pass: password.length >= 8 },
    { label: t('passwordChecks.uppercase'), pass: /[A-Z]/.test(password) },
    { label: t('passwordChecks.number'), pass: /\d/.test(password) },
    { label: t('passwordChecks.special'), pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const barColor = ['#f87171', '#f87171', '#fb923c', '#facc15', '#4ade80'][score];
  const label = ['', t('strength.weak'), t('strength.fair'), t('strength.good'), t('strength.strong')][score];
  if (!password) return null;
  return (

    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="flex flex-col gap-2"
    >
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="h-0.75 flex-1 rounded-full transition-colors duration-300"
            style={{ background: i <= score ? barColor : 'var(--edge)' }}
          />
        ))}
        <span className="min-w-11 text-right text-[11px] font-semibold" style={{ color: barColor }}>{label}</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {checks.map(c => (
          <div key={c.label} className="flex items-center gap-1.25">
            <Check size={11} className={c.pass ? 'text-green' : 'text-muted'} />
            <span className={`text-[11px] ${c.pass ? 'text-secondary' : 'text-muted'}`}>{c.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default PasswordStrength;