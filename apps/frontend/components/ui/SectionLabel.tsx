'use client';

import { motion } from 'framer-motion';

interface SectionLabelProps {
  text: string;
  color?: 'gold' | 'azure' | 'teal';
}

export default function SectionLabel({ text, color = 'gold' }: SectionLabelProps) {
  const colors = {
    gold: 'bg-[#f5a623]/10 border-[#f5a623]/20 text-[#f5a623]',
    azure: 'bg-[#1d4ed8]/10 border-[#1d4ed8]/20 text-[#3b82f6]',
    teal: 'bg-[#0d9488]/10 border-[#0d9488]/20 text-[#14b8a6]',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest ${colors[color]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${color === 'gold' ? 'bg-gold' : color === 'azure' ? 'bg-azure' : 'bg-teal'} animate-pulse`} />
      {text}
    </motion.div>
  );
}
