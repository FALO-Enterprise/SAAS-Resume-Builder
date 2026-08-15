'use client';

import { useSyncExternalStore } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';

function useIsMounted() {
  return useSyncExternalStore(
    () => () => { },
    () => true,   // client
    () => false   // server
  )
}

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const mounted = useIsMounted()

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
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
          key={mounted ? theme : 'sun'}
          initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
          transition={{ duration: 0.25 }}
          style={{ display: 'flex' }}
        >
          {mounted && theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
        </motion.div>
      </AnimatePresence>
    </button>
  );
}