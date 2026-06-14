'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import LoginForm from './LoginForm';
import Logo from '@/components/ui/Logo'

export default function AuthModal() {
  const { isOpen, activeTab, closeModal } = useAuth();
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
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />

          {/* Modal panel */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1001,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
          >            
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '460px',
                  maxHeight: '100vh',
                  background: '#13141a',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '24px',
                  boxShadow:'0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
                  padding: '32px 32px 40px',
                }}
            >
              {/* Close button */}
              <button
                onClick={closeModal}
                style={{
                  position: 'absolute', top: 20, right: 20,
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.2s', color: 'rgba(255,255,255,0.5)',
                }}
                onMouseEnter={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.1)'; el.style.color = '#fff'; }}
                onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.05)'; el.style.color = 'rgba(255,255,255,0.5)'; }}
              >
                <X size={14} />
              </button>

              {/* Logo */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' , marginBottom: 28 }}>
                <Logo />
              </div>

              {/* Heading */}
              <div style={{ marginBottom: 24 }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: activeTab === 'login' ? -10 : 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: activeTab === 'login' ? 10 : -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 22, marginBottom: 4, fontFamily: 'Playfair Display, serif' }}>
                      {activeTab === 'login' ? t('heading.loginTitle') : t('heading.signupTitle')}
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
                      {t('heading.loginSubtitle')}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Form body — animated switch */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22 }}
                >
                  <LoginForm />
                </motion.div>
              </AnimatePresence>

              {/* Decorative glow */}
              <div style={{
                position: 'absolute', top: -60, right: -60, width: 200, height: 200,
                background: 'radial-gradient(circle, rgba(245,166,35,0.08) 0%, transparent 70%)',
                pointerEvents: 'none', borderRadius: '50%',
              }} />
              <div style={{
                position: 'absolute', bottom: -40, left: -40, width: 160, height: 160,
                background: 'radial-gradient(circle, rgba(29,78,216,0.08) 0%, transparent 70%)',
                pointerEvents: 'none', borderRadius: '50%',
              }} />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
