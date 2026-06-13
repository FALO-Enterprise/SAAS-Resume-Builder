'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';

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
  const [focused, setFocused] = useState(false);
  const locale = useLocale();
  const isRTL = locale === 'ar';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        background: focused ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${error ? 'rgba(248,113,113,0.5)' : focused ? 'rgba(245,166,35,0.5)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 12, padding: '0 16px',
        transition: 'all 0.2s',
        boxShadow: focused ? '0 0 0 3px rgba(245,166,35,0.08)' : 'none',
      }}>
        <Icon size={16} color={focused ? '#f5a623' : 'rgba(255,255,255,0.3)'} style={{ flexShrink: 0, transition: 'color 0.2s' }} />
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: '#fff', fontSize: 14, padding: '14px 12px',
            fontFamily: 'inherit', textAlign: isRTL ? 'right' : 'left',
          }}
        />
        {rightSlot}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          style={{ color: '#f87171', fontSize: 12, paddingLeft: 4 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

// ─── Login Form ──────────────────────────────────────────────────────────────
export default function LoginForm() {
  const { switchTab, closeModal } = useAuth();
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
      // Replace the URL below with your actual backend endpoint.
      // Expected request body: { email, password }
      // Expected response:     { token: string, user: { id, name, email } }
      //                        OR { error: string } on failure
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

      // Store token — swap for cookie/session if your backend uses those
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
        style={{ textAlign: 'center', padding: '40px 0' }}
      >
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: 28,
        }}>✓</div>
        <p style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>{t('login.successTitle')}</p>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginTop: 6 }}>{t('login.successSubtitle')}</p>
      </motion.div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* General error banner */}
      {errors.general && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
            borderRadius: 10, padding: '12px 16px',
            color: '#f87171', fontSize: 13, textAlign: 'center',
          }}
        >
          {errors.general}
        </motion.div>
      )}

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
          <button type="button" onClick={() => setShowPw(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            {showPw
              ? <EyeOff size={15} color="rgba(255,255,255,0.35)" />
              : <Eye size={15} color="rgba(255,255,255,0.35)" />
            }
          </button>
        }
      />

      {/* Forgot password */}
      <div style={{ textAlign: 'right', marginTop: -8 }}>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f5a623', fontSize: 13, fontWeight: 500 }}>
          {t('login.forgotPassword')}
        </button>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: loading ? 'rgba(245,166,35,0.6)' : '#f5a623',
          color: '#0a0b0f', fontWeight: 700, fontSize: 15,
          padding: '15px 24px', borderRadius: 12, border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          width: '100%', transition: 'all 0.2s',
          boxShadow: loading ? 'none' : '0 8px 25px rgba(245,166,35,0.3)',
        }}
        onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
      >
        {loading
          ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> {t('login.loading')}</>
          : <><span>{t('login.submit')}</span><ArrowRight size={16} /></>
        }
      </button>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{t('login.or')}</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
      </div>

      {/* Switch to signup */}
      <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>
        {t('login.switchText')}{' '}
        <button
          onClick={() => switchTab('signup')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f5a623', fontWeight: 600, fontSize: 14 }}
        >
          {t('login.switchLink')}
        </button>
      </p>
    </div>
  );
}
