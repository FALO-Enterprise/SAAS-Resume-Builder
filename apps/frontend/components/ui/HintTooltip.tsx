'use client';

import { useId, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function HintTooltip({
  hint,
  className = '',
}: {
  hint: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  return (
    <div
      className={className}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="Show hint"
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="flex h-5 w-5 items-center justify-center rounded-full text-muted outline-none transition-colors hover:text-gold focus-visible:text-gold focus-visible:ring-2 focus-visible:ring-gold/40"
      >
        <HelpCircle size={14} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={tooltipId}
            role="tooltip"
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full inset-e-0 z-50 mt-2"
          >
            <div className="relative w-56 rounded-xl border border-edge bg-elevated px-3.5 py-2.5 text-start text-[12px] leading-normal text-secondary shadow-[0_12px_32px_var(--shadow-color)]">
              {/* Arrow */}
              <span className="absolute -top-1 inset-e-3 h-2 w-2 rotate-45 border-s border-t border-edge bg-elevated" />

              {hint}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}