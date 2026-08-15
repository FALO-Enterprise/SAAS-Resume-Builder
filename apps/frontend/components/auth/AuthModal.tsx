'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import LoginForm from './LoginForm';
import Logo from '@/components/ui/Logo';

export default function AuthModal() {
  const { isOpen, closeModal } = useAuth();
  const t = useTranslations('auth');

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeModal]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeModal}
            className="fixed inset-0 z-1000 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal panel */}
          <div className="fixed inset-0 z-1001 flex items-center justify-center p-4">
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative max-h-screen w-full max-w-115 overflow-hidden rounded-3xl border border-edge bg-elevated px-8 pb-10 pt-8 shadow-[0_40px_100px_var(--shadow-color)]"
            >
              {/* Close button */}
              <button
                onClick={closeModal}
                aria-label="Close"
                className="absolute inset-e-5 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-edge bg-card text-secondary transition-all hover:bg-card-hover hover:text-primary"
              >
                <X size={14} />
              </button>

              {/* Logo */}
              <div className="mb-7 flex items-center justify-center">
                <Logo />
              </div>

              {/* Heading */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-6"
              >
                <h2 className="mb-1 font-playfair text-[22px] font-extrabold text-primary">
                  {t('heading.loginTitle')}
                </h2>
                <p className="text-sm text-faint">
                  {t('heading.loginSubtitle')}
                </p>
              </motion.div>

              {/* Form body */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
              >
                <LoginForm />
              </motion.div>

              {/* Decorative glows — brand colors, constant in both themes */}
              <div className="pointer-events-none absolute -top-15 -right-15 h-50 w-50 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-gold)_8%,transparent)_0%,transparent_70%)]" />
              <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-azure)_8%,transparent)_0%,transparent_70%)]" />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}