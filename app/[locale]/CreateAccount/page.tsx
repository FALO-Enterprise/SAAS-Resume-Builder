'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Loader2, Check, Sparkles, Zap, Crown } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Step1Data {
  name: string;
  email: string;
  password: string;
  confirm: string;
}
interface Step1Errors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}
type PlanId = 'free' | 'pro' | 'enterprise';

// ─────────────────────────────────────────────────────────────────────────────
// Shared — Logo
// ─────────────────────────────────────────────────────────────────────────────
const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <div style={{ position: 'relative', width: 36, height: 36 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #f5a623, #d97706)', borderRadius: 10, transform: 'rotate(3deg)' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#fff', fontWeight: 900, fontSize: 16, fontFamily: 'Playfair Display, serif' }}>R</span>
      </div>
    </div>
    <span style={{ color: '#fff', fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em' }}>
      Resu<span style={{ color: '#f5a623' }}>Max</span>
    </span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Shared — Input
// ─────────────────────────────────────────────────────────────────────────────
function AuthInput({ icon: Icon, type, placeholder, value, onChange, error, rightSlot, label }: {
  icon: React.ElementType; type: string; placeholder: string;
  value: string; onChange: (v: string) => void;
  error?: string; rightSlot?: React.ReactNode; label?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 500 }}>{label}</label>}
      <div style={{
        display: 'flex', alignItems: 'center',
        background: focused ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${error ? 'rgba(248,113,113,0.5)' : focused ? 'rgba(245,166,35,0.5)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 12, padding: '0 16px', transition: 'all 0.2s',
        boxShadow: focused ? '0 0 0 3px rgba(245,166,35,0.08)' : 'none',
      }}>
        <Icon size={16} color={focused ? '#f5a623' : 'rgba(255,255,255,0.3)'} style={{ flexShrink: 0, transition: 'color 0.2s' }} />
        <input
          type={type} placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 14, padding: '14px 12px', fontFamily: 'inherit' }}
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

// ─────────────────────────────────────────────────────────────────────────────
// Shared — Password strength
// ─────────────────────────────────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters',    pass: password.length >= 8 },
    { label: 'Uppercase',        pass: /[A-Z]/.test(password) },
    { label: 'Number',           pass: /\d/.test(password) },
    { label: 'Special character', pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const barColor = ['#f87171', '#f87171', '#fb923c', '#facc15', '#4ade80'][score];
  const label    = ['', 'Weak', 'Fair', 'Good', 'Strong'][score];
  if (!password) return null;
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
      style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= score ? barColor : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
        ))}
        <span style={{ color: barColor, fontSize: 11, fontWeight: 600, minWidth: 44, textAlign: 'right' }}>{label}</span>
      </div>
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

// ─────────────────────────────────────────────────────────────────────────────
// Step indicator
// ─────────────────────────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {Array.from({ length: total }).map((_, i) => {
        const done    = i < current;
        const active  = i === current;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <motion.div
              animate={{
                background: done ? '#f5a623' : active ? 'rgba(245,166,35,0.15)' : 'rgba(255,255,255,0.06)',
                border: `1.5px solid ${done || active ? '#f5a623' : 'rgba(255,255,255,0.15)'}`,
                scale: active ? 1.1 : 1,
              }}
              transition={{ duration: 0.3 }}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {done
                ? <Check size={14} color="#0a0b0f" />
                : <span style={{ fontSize: 13, fontWeight: 700, color: active ? '#f5a623' : 'rgba(255,255,255,0.3)' }}>{i + 1}</span>
              }
            </motion.div>
            {i < total - 1 && (
              <div style={{ width: 48, height: 1.5, background: done ? '#f5a623' : 'rgba(255,255,255,0.1)', transition: 'background 0.4s', margin: '0 4px' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Personal information
// ─────────────────────────────────────────────────────────────────────────────
function Step1({ onNext }: { onNext: (data: Step1Data) => void }) {
  const [form, setForm] = useState<Step1Data>({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Step1Errors>({});
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validate = (): boolean => {
    const e: Step1Errors = {};
    if (!form.name.trim())                      e.name     = 'Full name is required';
    if (!form.email)                             e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email    = 'Enter a valid email';
    if (!form.password)                          e.password = 'Password is required';
    else if (form.password.length < 8)           e.password = 'Minimum 8 characters';
    if (!form.confirm)                           e.confirm  = 'Please confirm your password';
    else if (form.confirm !== form.password)     e.confirm  = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <AuthInput icon={User} type="text" placeholder="John Smith" label="Full name"
        value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} error={errors.name} />

      <AuthInput icon={Mail} type="email" placeholder="john@example.com" label="Email address"
        value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} error={errors.email} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AuthInput icon={Lock} type={showPw ? 'text' : 'password'} placeholder="Create a strong password" label="Password"
          value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} error={errors.password}
          rightSlot={
            <button type="button" onClick={() => setShowPw(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              {showPw ? <EyeOff size={15} color="rgba(255,255,255,0.35)" /> : <Eye size={15} color="rgba(255,255,255,0.35)" />}
            </button>
          }
        />
        <PasswordStrength password={form.password} />
      </div>

      <AuthInput icon={Lock} type={showConfirm ? 'text' : 'password'} placeholder="Repeat your password" label="Confirm password"
        value={form.confirm} onChange={v => setForm(f => ({ ...f, confirm: v }))} error={errors.confirm}
        rightSlot={
          <button type="button" onClick={() => setShowConfirm(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            {showConfirm ? <EyeOff size={15} color="rgba(255,255,255,0.35)" /> : <Eye size={15} color="rgba(255,255,255,0.35)" />}
          </button>
        }
      />

      <button
        onClick={() => { if (validate()) onNext(form); }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: '#f5a623', color: '#0a0b0f', fontWeight: 700, fontSize: 15,
          padding: '16px 24px', borderRadius: 12, border: 'none',
          cursor: 'pointer', width: '100%', transition: 'all 0.2s',
          boxShadow: '0 8px 25px rgba(245,166,35,0.3)', marginTop: 4,
        }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-1px)'; el.style.boxShadow = '0 12px 35px rgba(245,166,35,0.45)'; }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = '0 8px 25px rgba(245,166,35,0.3)'; }}
      >
        Continue <ArrowRight size={16} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — Choose a plan
// ─────────────────────────────────────────────────────────────────────────────
const plans: {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  badge?: string;
  icon: React.ElementType;
  iconColor: string;
  accentColor: string;
  borderColor: string;
  features: string[];
}[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    icon: Sparkles,
    iconColor: '#94a3b8',
    accentColor: 'rgba(148,163,184,0.15)',
    borderColor: 'rgba(148,163,184,0.2)',
    features: [
      '3 resume exports / month',
      '5 starter templates',
      'PDF export only',
      'Basic ATS check',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9',
    period: 'per month',
    badge: 'Most Popular',
    icon: Zap,
    iconColor: '#f5a623',
    accentColor: 'rgba(245,166,35,0.12)',
    borderColor: 'rgba(245,166,35,0.35)',
    features: [
      'Unlimited resume exports',
      '120+ premium templates',
      'PDF, DOCX & LinkedIn export',
      'Full ATS optimizer + score',
      'AI cover letter builder',
      'Real-time preview',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$29',
    period: 'per month',
    icon: Crown,
    iconColor: '#a78bfa',
    accentColor: 'rgba(167,139,250,0.12)',
    borderColor: 'rgba(167,139,250,0.3)',
    features: [
      'Everything in Pro',
      'Team workspace (up to 20)',
      'GPT resume coach',
      'Job-match scoring',
      'LinkedIn sync',
      'Priority support',
    ],
  },
];

function Step2({ onBack, onSubmit, loading }: {
  onBack: () => void;
  onSubmit: (plan: PlanId) => void;
  loading: boolean;
}) {
  const [selected, setSelected] = useState<PlanId>('pro');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Plan cards */}
      {plans.map(plan => {
        const active = selected === plan.id;
        const Icon = plan.icon;
        return (
          <motion.button
            key={plan.id}
            onClick={() => setSelected(plan.id)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 16,
              background: active ? plan.accentColor : 'rgba(255,255,255,0.02)',
              border: `1.5px solid ${active ? plan.borderColor : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 16, padding: '18px 20px',
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.25s',
              boxShadow: active && plan.id === 'pro' ? '0 0 30px rgba(245,166,35,0.1)' : 'none',
              position: 'relative', overflow: 'hidden',
            }}
          >
            {/* Selected ring */}
            {active && (
              <motion.div
                layoutId="plan-ring"
                style={{
                  position: 'absolute', inset: 0, borderRadius: 14,
                  border: `1.5px solid ${plan.borderColor}`,
                  pointerEvents: 'none',
                }}
              />
            )}

            {/* Badge */}
            {plan.badge && (
              <div style={{
                position: 'absolute', top: 14, right: 14,
                background: '#f5a623', color: '#0a0b0f',
                fontSize: 10, fontWeight: 700, padding: '3px 10px',
                borderRadius: 9999, letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>
                {plan.badge}
              </div>
            )}

            {/* Icon */}
            <div style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0, marginTop: 2,
              background: plan.accentColor, border: `1px solid ${plan.borderColor}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={20} color={plan.iconColor} />
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{plan.name}</span>
                <span style={{ color: plan.iconColor, fontWeight: 800, fontSize: 20, fontFamily: 'Playfair Display, serif' }}>{plan.price}</span>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>/ {plan.period}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                      background: active ? plan.accentColor : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${active ? plan.borderColor : 'rgba(255,255,255,0.1)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Check size={9} color={active ? plan.iconColor : 'rgba(255,255,255,0.3)'} />
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Radio */}
            <div style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
              border: `2px solid ${active ? plan.iconColor : 'rgba(255,255,255,0.2)'}`,
              background: active ? plan.iconColor : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', marginTop: 4,
            }}>
              {active && <div style={{ width: 7, height: 7, borderRadius: '50%', background: plan.id === 'pro' ? '#0a0b0f' : '#fff' }} />}
            </div>
          </motion.button>
        );
      })}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: 14,
            padding: '14px 20px', borderRadius: 12, cursor: 'pointer',
            transition: 'all 0.2s', minWidth: 100,
          }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.08)'; el.style.color = '#fff'; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.05)'; el.style.color = 'rgba(255,255,255,0.7)'; }}
        >
          <ArrowLeft size={15} /> Back
        </button>

        <button
          onClick={() => onSubmit(selected)}
          disabled={loading}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: loading ? 'rgba(245,166,35,0.6)' : '#f5a623',
            color: '#0a0b0f', fontWeight: 700, fontSize: 15,
            padding: '14px 24px', borderRadius: 12, border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
            boxShadow: loading ? 'none' : '0 8px 25px rgba(245,166,35,0.3)',
          }}
          onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
        >
          {loading
            ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating account…</>
            : <><span>{selected === 'free' ? 'Get started free' : `Start ${plans.find(p => p.id === selected)?.name} plan`}</span><ArrowRight size={16} /></>
          }
        </button>
      </div>

      <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
        {selected === 'free' ? 'No credit card required' : 'Cancel anytime · Secure payment via Stripe'}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Success screen
// ─────────────────────────────────────────────────────────────────────────────
function SuccessScreen({ name, plan }: { name: string; plan: PlanId }) {
  const planLabel = plans.find(p => p.id === plan)?.name ?? plan;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{ textAlign: 'center', padding: '20px 0 10px' }}
    >
      <motion.div
        animate={{ scale: [0, 1.2, 1] }} transition={{ duration: 0.5 }}
        style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 24px',
          background: 'rgba(74,222,128,0.12)', border: '1.5px solid rgba(74,222,128,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Check size={32} color="#4ade80" />
      </motion.div>
      <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 26, marginBottom: 8, fontFamily: 'Playfair Display, serif' }}>
       you&apos;re in, {name.split(' ')[0]}!
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, lineHeight: 1.6, maxWidth: 320, margin: '0 auto 32px' }}>
        Your <span style={{ color: '#f5a623', fontWeight: 600 }}>{planLabel}</span> account is ready. Start building the resume that opens doors.
      </p>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)',
        borderRadius: 9999, padding: '6px 14px', marginBottom: 32,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'pulse 2s infinite' }} />
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Redirecting to dashboard…</span>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const locale = useLocale();
  const router = useRouter();

  const [step, setStep] = useState<0 | 1 | 2>(0); // 0=step1, 1=step2, 2=success
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleStep1 = (data: Step1Data) => {
    setStep1Data(data);
    setStep(1);
  };

  const handleSubmit = async (plan: PlanId) => {
    if (!step1Data) return;
    setLoading(true);
    setServerError('');

    try {
      // ── BACKEND CONNECTION ─────────────────────────────────────────────────
      // POST /api/auth/register
      // Body: { name, email, password, plan }
      // Response: { token, user }  |  { error }
      // ─────────────────────────────────────────────────────────────────────
      const res  = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...step1Data, plan }),
      });
      const data = await res.json();

      if (!res.ok) {
        setServerError(data?.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      if (data.token) localStorage.setItem('resumax_token', data.token);
      setStep(2);

      // Redirect to dashboard after a short delay
      setTimeout(() => router.push(`/${locale}/dashboard`), 2000);

    } catch {
      setServerError('Network error. Please try again.');
      setLoading(false);
    }
  };

  const stepLabels = ['Your info', 'Choose plan'];

  return (
    <main style={{ minHeight: '100vh', background: '#0a0b0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'relative', overflow: 'hidden' }}>

      {/* Background glows */}
      <div style={{ position: 'fixed', top: '15%', left: '10%', width: 500, height: 500, background: 'rgba(245,166,35,0.04)', filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '15%', right: '10%', width: 400, height: 400, background: 'rgba(29,78,216,0.05)', filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: '50%', right: '5%', width: 300, height: 300, background: 'rgba(167,139,250,0.04)', filter: 'blur(80px)', borderRadius: '50%', pointerEvents: 'none' }} />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%', maxWidth: step === 1 ? 560 : 500,
          background: '#13141a', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 28, padding: '40px 40px 48px',
          boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
          position: 'relative', zIndex: 10,
          transition: 'max-width 0.4s ease',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
          <Link href={`/${locale}`} style={{ textDecoration: 'none' }}>
            <Logo />
          </Link>
          {step < 2 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 500 }}>
                Step {(step as number) + 1} of 2
              </span>
            </div>
          )}
        </div>

        {/* Step indicator */}
        {step < 2 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
            <StepIndicator current={step as number} total={2} />
            <div style={{ display: 'flex', gap: 24 }}>
              {stepLabels.map((label, i) => (
                <span key={i} style={{
                  fontSize: 12, fontWeight: 600,
                  color: i === step ? '#f5a623' : i < step ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)',
                  transition: 'color 0.3s',
                }}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Section heading */}
        {step < 2 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.22 }}
              style={{ marginBottom: 28 }}
            >
              <h1 style={{ color: '#fff', fontWeight: 800, fontSize: 24, marginBottom: 6, fontFamily: 'Playfair Display, serif' }}>
                {step === 0 ? 'Create your account' : 'Pick your plan'}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
                {step === 0
                  ? 'Fill in your details to get started with ResuMax.'
                  : 'Choose the plan that fits your goals. Upgrade or cancel anytime.'}
              </p>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Server error banner (step 2) */}
        {serverError && step === 1 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 10, padding: '12px 16px', color: '#f87171', fontSize: 13, marginBottom: 20, textAlign: 'center' }}>
            {serverError}
          </motion.div>
        )}

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: step === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: step === 0 ? 20 : -20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {step === 0 && <Step1 onNext={handleStep1} />}
            {step === 1 && (
              <Step2
                onBack={() => setStep(0)}
                onSubmit={handleSubmit}
                loading={loading}
              />
            )}
            {step === 2 && step1Data && (
              <SuccessScreen name={step1Data.name} plan={step1Data ? (JSON.parse(localStorage.getItem('resumax_plan') || '"free"') as PlanId) : 'free'} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer — sign in link */}
        {step < 2 && (
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 14, marginTop: 28 }}>
            Already have an account?{' '}
            <Link href={`/${locale}`} style={{ color: '#f5a623', fontWeight: 600, textDecoration: 'none' }}
              onClick={() => {/* openLogin handled by landing page navbar */}}>
              Sign in
            </Link>
          </p>
        )}

        {/* Glows */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, background: 'radial-gradient(circle, rgba(245,166,35,0.07) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -50, left: -50, width: 180, height: 180, background: 'radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }} />
      </motion.div>

      {/* Bottom note */}
      {step < 2 && (
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          style={{ color: 'rgba(255,255,255,0.18)', fontSize: 12, marginTop: 24, textAlign: 'center' }}
        >
          By creating an account you agree to our{' '}
          <a href="#" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Terms</a>
          {' '}and{' '}
          <a href="#" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Privacy Policy</a>
        </motion.p>
      )}
    </main>
  );
}
