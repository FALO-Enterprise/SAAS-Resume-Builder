'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { FaGoogle, FaLinkedin, FaGithub } from 'react-icons/fa';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface FormState {
  email: string;
  password: string;
}

interface FieldError {
  email?: string;
  password?: string;
  general?: string;
}

// ─── Input component ────────────────────────────────────────────────────────
function AuthInput({
  icon: Icon,
  type,
  placeholder,
  value,
  onChange,
  error,
  rightSlot,
}: {
  icon: React.ElementType;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={`group flex items-center rounded-xl px-4 transition-all focus-within:bg-card-hover ${
          error
            ? 'border border-pink-light/50 bg-card'
            : 'border border-edge bg-card focus-within:border-gold/50 focus-within:shadow-[0_0_0_3px_rgba(245,166,35,0.08)]'
        }`}
      >
        <Icon size={16} className="shrink-0 text-muted transition-colors group-focus-within:text-gold" />
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 border-none bg-transparent px-3 py-3.5 text-sm text-primary outline-none text-start"
        />
        {rightSlot}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="pl-1 text-xs text-pink-light"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

// ─── Social providers ────────────────────────────────────────────────────────
const PROVIDERS = [
  { id: 'google',   label: 'Google',   Icon: FaGoogle,   color: 'text-primary' },
  { id: 'github',   label: 'GitHub',   Icon: FaGithub,   color: 'text-primary' },
  { id: 'linkedin', label: 'LinkedIn', Icon: FaLinkedin, color: '#0a66c2' },
] as const;

// ─── Login Form ──────────────────────────────────────────────────────────────
export default function LoginForm() {
  const { closeModal } = useAuth();
  const locale = useLocale();
  const t = useTranslations('auth');
  const isRTL = locale === 'ar';
  const [form, setForm] = useState<FormState>({ email: '', password: '' });
  const [errors, setErrors] = useState<FieldError>({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = (): boolean => {
    const e: FieldError = {};
    if (!form.email)                          e.email    = t('login.errors.emailRequired');
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email  = t('login.errors.invalidEmail');
    if (!form.password)                        e.password = t('login.errors.passwordRequired');
    else if (form.password.length < 6)         e.password = t('login.errors.passwordMin');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    try {
      // ── BACKEND CONNECTION ─────────────────────────────────────────────────
      // POST /api/auth/login   Body: { email, password }
      // Response: { token, user } | { error }
      // ──────────────────────────────────────────────────────────────────────
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ general: data?.error || t('login.errors.invalidCredentials') });
        return;
      }

      if (data.token) localStorage.setItem('resumax_token', data.token);

      setSuccess(true);
      setTimeout(() => closeModal(), 800);

    } catch {
      setErrors({ general: t('login.errors.network') });
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="py-10 text-center"
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-gold/30 bg-gold/15 text-[28px] text-gold">
          ✓
        </div>
        <p className="text-lg font-bold text-primary">{t('login.successTitle')}</p>
        <p className="mt-1.5 text-sm text-faint">{t('login.successSubtitle')}</p>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-5" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* General error banner */}
      {errors.general && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-[10px] border border-pink-light/25 bg-pink-light/10 px-4 py-3 text-center text-[13px] text-pink-light"
        >
          {errors.general}
        </motion.div>
      )}

      {/* Social providers */}
      <div className="flex gap-3">
        {PROVIDERS.map(({ id, label, Icon, color }) => (
          <button
            key={id}
            type="button"
            aria-label={`Continue with ${label}`}
            className="flex flex-1 items-center justify-center rounded-xl border border-edge bg-card py-3 transition-all hover:border-edge-strong hover:bg-card-hover"
          >
            <Icon size={20} color={color} />
          </button>
        ))}
      </div>

      {/* Divider — social / email */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-edge" />
        <span className="text-xs text-muted">{t('login.or')}</span>
        <div className="h-px flex-1 bg-edge" />
      </div>

      {/* Fields */}
      <AuthInput
        icon={Mail} type="email" placeholder={t('login.emailPlaceholder')}
        value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))}
        error={errors.email}
      />
      <AuthInput
        icon={Lock} type={showPw ? 'text' : 'password'} placeholder={t('login.passwordPlaceholder')}
        value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))}
        error={errors.password}
        rightSlot={
          <button type="button" onClick={() => setShowPw(p => !p)} className="cursor-pointer border-none bg-transparent p-1">
            {showPw
              ? <EyeOff size={15} className="text-faint" />
              : <Eye size={15} className="text-faint" />
            }
          </button>
        }
      />

      {/* Forgot password */}
      <div className="-mt-2 text-end">
        <button className="cursor-pointer border-none bg-transparent text-[13px] font-medium text-gold">
          {t('login.forgotPassword')}
        </button>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3.75 text-[15px] font-bold text-ink shadow-[0_8px_25px_rgba(245,166,35,0.3)] transition-all hover:-translate-y-px disabled:cursor-not-allowed disabled:bg-gold/60 disabled:shadow-none"
      >
        {loading
          ? <><Loader2 size={16} className="animate-spin" /> {t('login.loading')}</>
          : <><span>{t('login.submit')}</span><ArrowRight size={16} /></>
        }
      </button>

      {/* Switch to signup */}
      <p className="text-center text-sm text-faint">
        {t('login.switchText')}{' '}
        <Link
          href={`/${locale}/CreateAccount`}
          onClick={closeModal}
          className="cursor-pointer text-sm font-semibold text-gold"
        >
          {t('login.switchLink')}
        </Link>
      </p>
    </div>
  );
}