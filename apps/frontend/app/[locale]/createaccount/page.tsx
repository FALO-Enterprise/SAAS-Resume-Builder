'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Check } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/ui/Logo';
import type { RegisterData, FormErrors } from '@/lib/types/auth.types';
import { PROVIDERS } from '@/lib/placeholder-data/providors.placeholder';
import AuthInput from '@/components/ui/AuthInput';
import PasswordStrength from '@/lib/utilities/PasswordStrength'
import { getOAuthStartUrl } from '@/lib/backend';
import { useRegisterFlow } from '@/hooks/mutations/useRegisterFlow';

// ─────────────────────────────────────────────────────────────────────────────
// Register form
// ─────────────────────────────────────────────────────────────────────────────
function RegisterForm({ onSubmit, loading }: { onSubmit: (data: RegisterData) => void; loading: boolean }) {
  const t = useTranslations('auth.signup');
  const locale = useLocale();
  const [form, setForm] = useState<RegisterData>({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validate = (): boolean => {
    const e: FormErrors = {};

    if (!form.name.trim()) e.name = t('errors.nameRequired');

    if (!form.email) e.email = t('errors.emailRequired');
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = t('errors.invalidEmail');

    if (!form.password) e.password = t('errors.passwordRequired');
    else if (form.password.length < 8) e.password = t('errors.passwordMin');

    if (!form.confirm) e.confirm = t('errors.confirmRequired');
    else if (form.confirm !== form.password) e.confirm = t('errors.confirmMismatch');

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const eyeBtn = (shown: boolean, toggle: () => void) => (
    <button type="button" onClick={toggle} className="cursor-pointer border-none bg-transparent p-1">
      {shown ? <EyeOff size={15} className="text-faint" /> : <Eye size={15} className="text-faint" />}
    </button>
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Social providers */}
      <div className="flex gap-3">
        {PROVIDERS.map(({ id, label, Icon, color }) => (
          <button
            key={id}
            type="button"
            aria-label={`Continue with ${label}`}
            onClick={() => window.location.assign(getOAuthStartUrl(id, locale))}
            className="flex flex-1 items-center justify-center rounded-xl border border-edge bg-card py-3 transition-all hover:border-edge-strong hover:bg-card-hover"
          >
            <Icon size={20} className={color} />
          </button>
        ))}
      </div>

      {/* Divider — social / email */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-edge" />
        <span className="text-xs text-muted">{t('or')}</span>
        <div className="h-px flex-1 bg-edge" />
      </div>

      <AuthInput icon={User} type="text" placeholder={t('nameExample')} label={t('fullNamePlaceholder')} value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} error={errors.name} />

      <AuthInput icon={Mail} type="email" placeholder={t('emailExample')} label={t('emailPlaceholder')} value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} error={errors.email} />

      <div className="flex flex-col gap-2">
        <AuthInput icon={Lock} type={showPw ? 'text' : 'password'} placeholder={t('passwordInputPlaceholder')} label={t('passwordPlaceholder')} value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} error={errors.password} rightSlot={eyeBtn(showPw, () => setShowPw(p => !p))} />
        <PasswordStrength password={form.password} />
      </div>

      <AuthInput icon={Lock} type={showConfirm ? 'text' : 'password'} placeholder={t('confirmInputPlaceholder')} label={t('confirmPasswordPlaceholder')} value={form.confirm} onChange={v => setForm(f => ({ ...f, confirm: v }))} error={errors.confirm} rightSlot={eyeBtn(showConfirm, () => setShowConfirm(p => !p))} />
      <button
        onClick={() => { if (validate()) onSubmit(form); }}
        disabled={loading}
        className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-6 py-4 text-[15px] font-bold text-ink shadow-[0_8px_25px_rgba(245,166,35,0.3)] transition-all hover:-translate-y-px hover:shadow-[0_12px_35px_rgba(245,166,35,0.45)] disabled:cursor-not-allowed disabled:bg-gold/60 disabled:shadow-none">
        {loading ? <><Loader2 size={16} className="animate-spin" /> {t('loading')}</> : <><span>{t('submit')}</span><ArrowRight size={16} /></>}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Success screen
// ─────────────────────────────────────────────────────────────────────────────
function SuccessScreen({ name }: { name: string }) {
  const t = useTranslations('auth.signup');
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="px-0 pb-2.5 pt-5 text-center"
    >
      <motion.div
        animate={{ scale: [0, 1.2, 1] }} transition={{ duration: 0.5 }}
        className="mx-auto mb-6 flex h-18 w-18 items-center justify-center rounded-full border-[1.5px] border-green/30 bg-green/12"
      >
        <Check size={32} className="text-green" />
      </motion.div>
      <h2 className="mb-2 font-playfair text-[26px] font-extrabold text-primary">{t('successTitle', { name: name.split(' ')[0] })}</h2>
      <p className="mx-auto mb-8 max-w-[320px] text-[15px] leading-[1.6] text-faint">{t('successReady')}</p>
      <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-3.5 py-1.5">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green" />
        <span className="text-xs text-secondary">{t('redirecting')}</span>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const locale = useLocale();
  const t = useTranslations('auth.signup');

  const { openLogin } = useAuth();
  const { submit, isPending, generalError, success, registeredName } = useRegisterFlow();

  const handleSubmit = async (data: RegisterData) => {
    setLoading(true);
    setServerError('');

    try {
      // ── BACKEND CONNECTION ─────────────────────────────────────────────────
      // POST /api/auth/register
      // Body: { name, email, password }
      // Response: { user, message } | { error }
      // ─────────────────────────────────────────────────────────────────────
      const res = await fetch(buildBackendUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, email: data.email, password: data.password }),
      });
      const resData = await res.json();

      if (!res.ok) {
        const message = typeof resData?.error === 'string'
          ? resData.error
          : typeof resData?.error?.message === 'string'
            ? resData.error.message
            : t('errors.registrationFailed');
        setServerError(message);
        setLoading(false);
        return;
      }

      setName(data.name);
      setSuccess(true);

      setTimeout(() => router.push(`/${locale}/verificationcode?email=${encodeURIComponent(data.email)}`), 2000);

    } catch {
      setServerError(t('errors.network'));
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-base px-6 py-10">

      {/* Background glows */}
      <div className='fixed top-1/6 left-1/6 w-125 h-125 glow-gold rounded-full blur-2xl pointer-events-none' />
      <div className='fixed bottom-1/6 right-1/12 w-100 h-100 glow-azure rounded-full blur-2xl pointer-events-none' />
      <div className='fixed top-1/2 right-1/12 w-75 h-75 glow-gold rounded-full blur-2xl pointer-events-none' />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-125 rounded-[28px] border border-edge bg-elevated px-10 pb-12 pt-10 shadow-[0_40px_100px_var(--shadow-color)]"
      >
        {/* Header */}
        <div className="mb-9 flex items-center justify-between">
          <Link href={`/${locale}`} className="no-underline">
            <Logo />
          </Link>
        </div>

        {/* Section heading */}
        {!success && (
          <div className="mb-7">
            <h1 className="mb-1.5 font-playfair text-2xl font-extrabold text-primary">
              {t('title')}
            </h1>

            <p className="text-sm text-faint">
              {t('subtitle')}
            </p>
          </div>
        )}

        {/* Server error banner */}
        {generalError && !success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-5 rounded-[10px] border border-pink-light/25 bg-pink-light/10 px-4 py-3 text-center text-[13px] text-pink-light">
            {generalError}
          </motion.div>
        )}

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={success ? 'success' : 'form'}
            initial={{ opacity: 0, x: success ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: success ? -20 : 20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {!success
              ? <RegisterForm onSubmit={handleSubmit} loading={isPending} />
              : <SuccessScreen name={registeredName} />
            }
          </motion.div>
        </AnimatePresence>

        {/* Footer — sign in link */}
        {!success && (
          <p className="mt-7 text-center text-sm text-muted">
            {t('switchText')}{' '}
            <Link
              href={`/${locale}`}
              onClick={openLogin}
              className="font-semibold text-gold no-underline"
            >
              {t('switchLink')}
            </Link>
          </p>
        )}

        {/* Card-corner glows */}
        <div className="pointer-events-none absolute -top-15 -right-15 h-55 w-55 rounded-full bg-[radial-gradient(circle,rgba(245,166,35,0.07)_0%,transparent_70%)]" />
        <div className="pointer-events-none absolute -bottom-12.5 -left-12.5 h-45 w-45 rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.06)_0%,transparent_70%)]" />
      </motion.div>

      {/* Bottom note */}
      {!success && (
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="mt-6 text-center text-xs text-muted"
        >
          {t('termsPrefix')}{' '}
          <a href="#" className="text-faint no-underline">
            {t('termsLink')}
          </a>
          {' '}
          {t('termsAnd')}
          {' '}
          <a href="#" className="text-faint no-underline">
            {t('policyLink')}
          </a>
        </motion.p>
      )}
    </main>
  );
}
