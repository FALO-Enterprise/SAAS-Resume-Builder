'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function HintTooltip({ hint, className = '' }: { hint: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={wrapRef}
      className={className}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={open ? 'Hide hint' : 'Show hint'}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((o) => !o)}
        className="flex h-5 w-5 items-center justify-center rounded-full text-muted outline-none transition-colors hover:text-gold focus-visible:text-gold focus-visible:ring-2 focus-visible:ring-gold/40"
      >
        <HelpCircle size={14} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={tooltipId}
            role="tooltip"
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-e-0 top-full z-40 pt-2"
          >
            <div className="relative w-56 rounded-xl border border-edge bg-elevated px-3.5 py-2.5 text-start text-[12px] leading-normal text-secondary shadow-[0_12px_32px_var(--shadow-color)]">
              <span className="absolute -top-1 inset-e-3 h-2 w-2 rotate-45 border-s border-t border-edge bg-elevated" />
              {hint}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
