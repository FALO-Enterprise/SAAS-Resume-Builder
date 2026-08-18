'use client';

import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
  const { theme, themeMode, toggleTheme, mounted } = useTheme();

  const icon = mounted && theme === 'dark' ? 'moon' : 'sun';

  return (
    <button
      onClick={toggleTheme}
      aria-label={
        mounted && themeMode === 'system'
          ? `Toggle theme (following system: ${theme})`
          : 'Toggle theme'
      }
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 36, height: 36, borderRadius: 8,
        background: 'transparent',
        border: '1px solid var(--edge)',
        color: 'var(--text-ink-soft)',
        cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
      }}
      onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = 'var(--edge-strong)'; el.style.color = 'var(--text-ink)'; }}
      onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = 'var(--edge)'; el.style.color = 'var(--text-ink-soft)'; }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={icon}
          initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
          transition={{ duration: 0.25 }}
          style={{ display: 'flex' }}
        >
          {icon === 'moon' ? <Moon size={15} /> : <Sun size={15} />}
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
