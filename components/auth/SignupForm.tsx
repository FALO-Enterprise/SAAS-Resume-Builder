'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Check } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';

interface FormState {
  name: string;
  email: string;
  password: string;
  confirm: string;
}

interface FieldError {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
  general?: string;
}

// ─── Password strength meter ─────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const t = useTranslations('auth');
  const checks = [
    { label: t('signup.passwordChecks.length'), pass: password.length >= 8 },
    { label: t('signup.passwordChecks.uppercase'), pass: /[A-Z]/.test(password) },
    { label: t('signup.passwordChecks.number'), pass: /\d/.test(password) },
    { label: t('signup.passwordChecks.special'), pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const barColor = score <= 1 ? '#f87171' : score <= 2 ? '#fb923c' : score === 3 ? '#facc15' : '#4ade80';
  const label    = score <= 1 ? t('signup.strength.weak') : score <= 2 ? t('signup.strength.fair') : score === 3 ? t('signup.strength.good') : t('signup.strength.strong');

  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
      style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      {/* Bar */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', direction: isRTL ? 'rtl' : 'ltr' }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 99,
            background: i <= score ? barColor : 'rgba(255,255,255,0.1)',
            transition: 'background 0.3s',
          }} />
        ))}
        <span style={{ color: barColor, fontSize: 11, fontWeight: 600, minWidth: 44, textAlign: 'right', transition: 'color 0.3s' }}>{label}</span>
      </div>
      {/* Checklist */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
        {checks.map(c => (
          <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Check size={11} color={c.pass ? '#4ade80' : 'rgba(255,255,255,0.2)'} />
            <span style={{ fontSize: 11, color: c.pass ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.3)' }}>{c.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Input ───────────────────────────────────────────────────────────────────
function AuthInput({
  icon: Icon, type, placeholder, value, onChange, error, rightSlot,
}: {
  icon: React.ElementType; 
  type: string; placeholder: 
  string;
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
          type={type} placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: '#fff', fontSize: 14, padding: '14px 12px', fontFamily: 'inherit', textAlign: isRTL ? 'right' : 'left',
          }}
        />
        {rightSlot}
      </div>
      {error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          style={{ color: '#f87171', fontSize: 12, paddingLeft: 4 }}>
          {error}
        </motion.p>
      )}
    </div>
  );
}

// ─── Signup Form ─────────────────────────────────────────────────────────────
export default function SignupForm() {
  const { switchTab, closeModal } = useAuth();
  const locale = useLocale();
  const t = useTranslations('auth');
  const isRTL = locale === 'ar';
  const [form, setForm] = useState<FormState>({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<FieldError>({});
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const validate = (): boolean => {
    const e: FieldError = {};
    if (!form.name.trim())                      e.name     = t('signup.errors.nameRequired');
    if (!form.email)                             e.email    = t('signup.errors.emailRequired');
    else if (!/\S+@\S+\.\S+/.test(form.email))  e.email    = t('signup.errors.invalidEmail');
    if (!form.password)                          e.password = t('signup.errors.passwordRequired');
    else if (form.password.length < 8)           e.password = t('signup.errors.passwordMin');
    if (!form.confirm)                           e.confirm  = t('signup.errors.confirmRequired');
    else if (form.confirm !== form.password)     e.confirm  = t('signup.errors.confirmMismatch');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!agreed) { setErrors({ general: t('signup.errors.termsRequired') }); return; }
    setLoading(true);
    setErrors({});

    try {
      // ── BACKEND CONNECTION ─────────────────────────────────────────────────
      // Replace the URL below with your actual backend endpoint.
      // Expected request body: { name, email, password }
      // Expected response:     { token: string, user: { id, name, email } }
      //                        OR { error: string } on failure
      //                        Common errors: "Email already in use"
      // ──────────────────────────────────────────────────────────────────────
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ general: data?.error || t('signup.errors.registrationFailed') });
        return;
      }

      // Store token — swap for cookie/session if your backend uses those
      if (data.token) localStorage.setItem('resumax_token', data.token);

      setSuccess(true);
      setTimeout(() => closeModal(), 900);

    } catch {
      setErrors({ general: t('signup.errors.network') });
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
        <motion.div
          animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.4 }}
          style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <Check size={28} color="#4ade80" />
        </motion.div>
        <p style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>{t('signup.successTitle')}</p>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginTop: 6 }}>{t('signup.successSubtitle', { name: form.name.split(' ')[0] })}</p>
      </motion.div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* General error */}
      {errors.general && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
            borderRadius: 10, padding: '12px 16px', color: '#f87171', fontSize: 13, textAlign: 'center',
          }}>
          {errors.general}
        </motion.div>
      )}

      {/* Fields */}
      <AuthInput
        icon={User} type="text" placeholder={t('signup.fullNamePlaceholder')}
        value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))}
        error={errors.name}
      />
      <AuthInput
        icon={Mail} type="email" placeholder={t('signup.emailPlaceholder')}
        value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))}
        error={errors.email}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AuthInput
          icon={Lock} type={showPw ? 'text' : 'password'} placeholder={t('signup.passwordPlaceholder')}
          value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))}
          error={errors.password}
          rightSlot={
            <button type="button" onClick={() => setShowPw(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              {showPw ? <EyeOff size={15} color="rgba(255,255,255,0.35)" /> : <Eye size={15} color="rgba(255,255,255,0.35)" />}
            </button>
          }
        />
        <PasswordStrength password={form.password} />
      </div>
      <AuthInput
        icon={Lock} type={showConfirm ? 'text' : 'password'} placeholder={t('signup.confirmPasswordPlaceholder')}
        value={form.confirm} onChange={v => setForm(f => ({ ...f, confirm: v }))}
        error={errors.confirm}
        rightSlot={
          <button type="button" onClick={() => setShowConfirm(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            {showConfirm ? <EyeOff size={15} color="rgba(255,255,255,0.35)" /> : <Eye size={15} color="rgba(255,255,255,0.35)" />}
          </button>
        }
      />

      {/* Terms */}
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
        <div
          onClick={() => setAgreed(a => !a)}
          style={{
            width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
            background: agreed ? '#f5a623' : 'transparent',
            border: `1.5px solid ${agreed ? '#f5a623' : 'rgba(255,255,255,0.2)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s', cursor: 'pointer',
          }}
        >
          {agreed && <Check size={11} color="#0a0b0f" />}
        </div>
        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.5 }}>
          {t('signup.termsPrefix')}{' '}
          <a href="#" style={{ color: '#f5a623', textDecoration: 'none' }}>{t('signup.termsLink')}</a>
          {' '}{t('signup.termsAnd')}{' '}
          <a href="#" style={{ color: '#f5a623', textDecoration: 'none' }}>{t('signup.policyLink')}</a>
        </span>
      </label>

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
          marginTop: 4,
        }}
        onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
      >
        {loading
          ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> {t('signup.loading')}</>
          : <><span>{t('signup.submit')}</span><ArrowRight size={16} /></>
        }
      </button>

      {/* Switch to login */}
      <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>
        {t('signup.switchText')}{' '}
        <button
          onClick={() => switchTab('login')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f5a623', fontWeight: 600, fontSize: 14 }}
        >
          {t('signup.switchLink')}
        </button>
      </p>
    </div>
  );
}
