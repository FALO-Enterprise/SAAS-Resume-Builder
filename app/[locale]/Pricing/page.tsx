// app/[locale]/pricing/page.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ChevronDown, ArrowRight, Zap } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { PLANS, type PlanId } from '@/lib/plans';
import Navbar from '@/components/ui/Navbar'

// ─────────────────────────────────────────────────────────────────────────────
// Feature comparison table data
// ─────────────────────────────────────────────────────────────────────────────
const TABLE_SECTIONS = [
  {
    title: 'Core Builder',
    rows: [
      { label: 'Resume exports / month', free: '3', pro: 'Unlimited', enterprise: 'Unlimited' },
      { label: 'Templates',              free: '5', pro: '120+',      enterprise: '120+' },
      { label: 'Real-time preview',      free: true, pro: true,       enterprise: true  },
      { label: 'PDF export',             free: true, pro: true,       enterprise: true  },
      { label: 'DOCX export',            free: false, pro: true,      enterprise: true  },
      { label: 'LinkedIn-ready export',  free: false, pro: true,      enterprise: true  },
    ],
  },
  {
    title: 'AI & Optimization',
    rows: [
      { label: 'ATS check',              free: 'Basic', pro: 'Full',  enterprise: 'Full' },
      { label: 'ATS score',              free: false,   pro: true,    enterprise: true  },
      { label: 'Keyword analysis',       free: false,   pro: true,    enterprise: true  },
      { label: 'AI cover letter',        free: false,   pro: true,    enterprise: true  },
      { label: 'GPT resume coach',       free: false,   pro: false,   enterprise: true  },
      { label: 'Job-match scoring',      free: false,   pro: false,   enterprise: true  },
    ],
  },
  {
    title: 'Global & Regional',
    rows: [
      { label: 'US / Canada format',     free: true,  pro: true,  enterprise: true },
      { label: 'EU Europass format',     free: false, pro: true,  enterprise: true },
      { label: 'GCC / Middle East',      free: false, pro: true,  enterprise: true },
      { label: 'Asia-Pacific format',    free: false, pro: true,  enterprise: true },
      { label: 'Academic CV',            free: false, pro: true,  enterprise: true },
      { label: 'RTL language support',   free: true,  pro: true,  enterprise: true },
    ],
  },
  {
    title: 'Team & Collaboration',
    rows: [
      { label: 'Team workspace',         free: false, pro: false,      enterprise: 'Up to 20' },
      { label: 'LinkedIn sync',          free: false, pro: false,      enterprise: true },
      { label: 'Priority support',       free: false, pro: false,      enterprise: true },
      { label: 'Custom branding',        free: false, pro: false,      enterprise: true },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// FAQ data
// ─────────────────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'Can I switch plans later?',
    a: 'Yes, you can upgrade or downgrade at any time. When you upgrade, you get access to the new features immediately. When you downgrade, the change takes effect at the start of your next billing cycle.',
  },
  {
    q: 'Is there a free trial for Pro or Enterprise?',
    a: 'You can start with the Free plan at any time with no credit card required. We also offer a 7-day money-back guarantee on Pro and Enterprise plans if you are not satisfied.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards (Visa, Mastercard, Amex) and PayPal via Stripe. All transactions are encrypted and secure.',
  },
  {
    q: 'How does the yearly billing discount work?',
    a: 'When you choose yearly billing, you pay for 10 months and get 2 months free — roughly a 22% discount compared to monthly billing.',
  },
  {
    q: 'Can I cancel my subscription?',
    a: 'Absolutely. You can cancel any time from your account settings. You keep access to all paid features until the end of your current billing period.',
  },
  {
    q: 'Do you support Arabic and RTL languages?',
    a: 'Yes. ResuMax is fully bilingual — both the interface and the resume builder support Arabic with proper RTL layout. All plans include this.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Cell renderer — handles boolean | string values in table
// ─────────────────────────────────────────────────────────────────────────────
function Cell({ value, highlight }: { value: boolean | string; highlight?: boolean }) {
  if (typeof value === 'boolean') {
    return value
      ? <div style={{ width: 22, height: 22, borderRadius: '50%', background: highlight ? 'rgba(245,166,35,0.15)' : 'rgba(74,222,128,0.12)', border: `1px solid ${highlight ? 'rgba(245,166,35,0.3)' : 'rgba(74,222,128,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
          <Check size={12} color={highlight ? '#f5a623' : '#4ade80'} />
        </div>
      : <div style={{ display: 'flex', justifyContent: 'center' }}>
          <X size={15} color="rgba(255,255,255,0.2)" />
        </div>;
  }
  return <span style={{ fontSize: 13, fontWeight: 600, color: highlight ? '#f5a623' : 'rgba(255,255,255,0.7)' }}>{value}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// FAQ Item
// ─────────────────────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 0', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left', gap: 16,
        }}
      >
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 15, lineHeight: 1.4 }}>{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown size={18} color="rgba(255,255,255,0.4)" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.8, paddingBottom: 20 }}>
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function PricingPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [yearly, setYearly] = useState(false);

  const goToRegister = (planId: PlanId) => {
    router.push(`/${locale}/register?plan=${planId}`);
  };


  return (
    <main style={{ minHeight: '100vh', background: '#0a0b0f', color: '#f5f4f0', overflowX: 'hidden' }}>

      {/* ── Background glows ─────────────────────────────── */}
      <div style={{ position: 'fixed', top: '5%', left: '5%', width: 500, height: 500, background: 'rgba(245,166,35,0.04)', filter: 'blur(120px)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '10%', right: '5%', width: 400, height: 400, background: 'rgba(167,139,250,0.05)', filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />

      {/* ── Minimal top nav ──────────────────────────────── */}
      {/* <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10,11,15,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href={`/${locale}`} style={{ textDecoration: 'none' }}><Logo /></Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <a
              href={`/${locale}/CreateAccount`}
              style={{ background: '#f5a623', color: '#0a0b0f', fontWeight: 700, fontSize: 13, padding: '9px 20px', borderRadius: 9999, border: 'none', cursor: 'pointer' }}
            >
              {t('nav.getStarted')}
            </a>
          </div>
        </div>
      </nav> */}
      <Navbar />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

        {/* ── Hero header ──────────────────────────────────── */}
        <div style={{ textAlign: 'center', padding: '80px 0 64px' }}>
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: 9999, padding: '6px 16px', marginBottom: 24 }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f5a623', animation: 'pulse 2s infinite' }} />
            <span style={{ color: '#f5a623', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{t('pricing.hero.badge')}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            style={{ fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 16, fontFamily: 'Playfair Display, serif' }}
          >
            <span style={{ color: '#fff' }}>{t('pricing.hero.titleLine1')}</span>
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #f5a623, #fbbf24, #f59e0b)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>{t('pricing.hero.titleHighlight')}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            style={{ color: 'rgba(255,255,255,0.5)', fontSize: 17, maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.7 }}
          >
            {t('pricing.hero.subtitle')}
          </motion.p>

          {/* Billing toggle */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9999, padding: '6px 6px 6px 20px' }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: !yearly ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'color 0.2s' }}>Monthly</span>

            <button
              onClick={() => setYearly(y => !y)}
              style={{
                width: 44, height: 26, borderRadius: 9999, border: 'none', cursor: 'pointer', position: 'relative',
                background: yearly ? '#f5a623' : 'rgba(255,255,255,0.12)',
                transition: 'background 0.25s', flexShrink: 0,
              }}
            >
              <motion.div
                animate={{ x: yearly ? 20 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                style={{ position: 'absolute', top: 3, width: 20, height: 20, borderRadius: '50%', background: '#fff' }}
              />
            </button>

            <span style={{ fontSize: 13, fontWeight: 600, color: yearly ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'color 0.2s' }}>Yearly</span>

            <AnimatePresence>
              {yearly && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: -8 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.8 }}
                  style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 9999, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Zap size={11} color="#4ade80" />
                  <span style={{ color: '#4ade80', fontSize: 11, fontWeight: 700 }}>Save 22%</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* ── Plan cards ───────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 80, alignItems: 'start' }}>
          {PLANS.map((plan, i) => {
            const Icon = plan.icon;
            const isPopular = plan.badge === 'Most Popular';
            const price = yearly && plan.yearlyPrice > 0 ? plan.yearlyPrice : plan.monthlyPrice;
            const isFree = plan.monthlyPrice === 0;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                style={{
                  background: isPopular ? 'rgba(245,166,35,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1.5px solid ${isPopular ? 'rgba(245,166,35,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 22,
                  padding: '32px 28px 28px',
                  position: 'relative',
                  transform: isPopular ? 'translateY(-12px)' : 'none',
                  boxShadow: isPopular ? '0 0 50px rgba(245,166,35,0.08)' : 'none',
                }}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div style={{
                    position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #f5a623, #d97706)',
                    color: '#0a0b0f', fontSize: 11, fontWeight: 800,
                    padding: '5px 18px', borderRadius: 9999,
                    textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap',
                  }}>
                    ⚡ Most Popular
                  </div>
                )}

                {/* Plan icon + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: plan.accentColor, border: `1px solid ${plan.borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={22} color={plan.iconColor} />
                  </div>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 17 }}>{plan.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
                      {isFree ? 'Always free' : yearly ? 'Billed annually' : 'Billed monthly'}
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500, alignSelf: 'flex-start', marginTop: 8 }}>$</span>
                    <motion.span
                      key={`${plan.id}-${yearly}`}
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      style={{ fontSize: 52, fontWeight: 900, color: '#fff', lineHeight: 1, fontFamily: 'Playfair Display, serif' }}
                    >
                      {price}
                    </motion.span>
                    {!isFree && (
                      <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 4, alignSelf: 'flex-end' }}>/ mo</span>
                    )}
                  </div>
                  {yearly && !isFree && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 4 }}>
                      Billed ${plan.yearlyPrice * 12}/year
                    </motion.div>
                  )}
                </div>

                {/* CTA button */}
                <button
                  onClick={() => goToRegister(plan.id)}
                  style={{
                    width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                    fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s',
                    marginBottom: 28,
                    background: isPopular ? '#f5a623' : 'rgba(255,255,255,0.07)',
                    color: isPopular ? '#0a0b0f' : 'rgba(255,255,255,0.8)',
                    boxShadow: isPopular ? '0 8px 24px rgba(245,166,35,0.3)' : 'none',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = 'translateY(-2px)';
                    if (isPopular) { el.style.background = '#fbbf24'; el.style.boxShadow = '0 12px 32px rgba(245,166,35,0.45)'; }
                    else           { el.style.background = 'rgba(255,255,255,0.12)'; el.style.color = '#fff'; }
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = 'translateY(0)';
                    if (isPopular) { el.style.background = '#f5a623'; el.style.boxShadow = '0 8px 24px rgba(245,166,35,0.3)'; }
                    else           { el.style.background = 'rgba(255,255,255,0.07)'; el.style.color = 'rgba(255,255,255,0.8)'; }
                  }}
                >
                  {isFree ? 'Get started free' : `Start ${plan.name}`} →
                </button>

                {/* Divider */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 24 }} />

                {/* Features */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1, background: plan.accentColor, border: `1px solid ${plan.borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={10} color={plan.iconColor} />
                      </div>
                      <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Comparison table ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          style={{ marginBottom: 100 }}
        >
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 'clamp(28px, 4vw, 42px)', fontFamily: 'Playfair Display, serif', marginBottom: 12 }}>
              Compare all features
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>Everything side by side so you can pick with confidence.</p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ padding: '20px 24px', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Feature</div>
              {PLANS.map(p => (
                <div key={p.id} style={{ padding: '20px 16px', textAlign: 'center' }}>
                  <span style={{ color: p.id === 'pro' ? '#f5a623' : '#fff', fontWeight: 700, fontSize: 14 }}>{p.name}</span>
                </div>
              ))}
            </div>

            {/* Sections */}
            {TABLE_SECTIONS.map((section, si) => (
              <div key={section.title}>
                <div style={{ padding: '14px 24px', background: 'rgba(255,255,255,0.025)', borderTop: si > 0 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{section.title}</span>
                </div>
                {section.rows.map((row, ri) => (
                  <div
                    key={row.label}
                    style={{
                      display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
                      borderTop: '1px solid rgba(255,255,255,0.04)',
                      background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}
                  >
                    <div style={{ padding: '14px 24px', color: 'rgba(255,255,255,0.65)', fontSize: 13, display: 'flex', alignItems: 'center' }}>{row.label}</div>
                    <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Cell value={row.free} />
                    </div>
                    <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(245,166,35,0.03)' }}>
                      <Cell value={row.pro} highlight />
                    </div>
                    <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Cell value={row.enterprise} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── FAQ ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          style={{ maxWidth: 720, margin: '0 auto 100px' }}
        >
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 'clamp(28px, 4vw, 42px)', fontFamily: 'Playfair Display, serif', marginBottom: 12 }}>
              Frequently asked questions
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>Everything you need to know before deciding.</p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '8px 32px' }}>
            {FAQS.map(faq => <FaqItem key={faq.q} q={faq.q} a={faq.a} />)}
          </div>
        </motion.div>

        {/* ── Bottom CTA ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          style={{
            textAlign: 'center', marginBottom: 80, padding: '60px 32px',
            background: 'rgba(245,166,35,0.05)', border: '1px solid rgba(245,166,35,0.15)',
            borderRadius: 24, position: 'relative', overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 400, height: 200, background: 'rgba(245,166,35,0.06)', filter: 'blur(60px)', borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 'clamp(26px, 4vw, 40px)', marginBottom: 12, fontFamily: 'Playfair Display, serif' }}>
              Still not sure which plan?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, marginBottom: 32, maxWidth: 440, margin: '0 auto 32px' }}>
              Start with Free — no credit card, no commitment. You can always upgrade in one click.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => goToRegister('free')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f5a623', color: '#0a0b0f', fontWeight: 700, fontSize: 15, padding: '16px 32px', borderRadius: 12, border: 'none', cursor: 'pointer', boxShadow: '0 8px 28px rgba(245,166,35,0.35)' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#fbbf24'; el.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#f5a623'; el.style.transform = 'translateY(0)'; }}
              >
                Start for free <ArrowRight size={16} />
              </button>
              <button
                onClick={() => goToRegister('pro')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: 15, padding: '16px 32px', borderRadius: 12, cursor: 'pointer' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.1)'; el.style.color = '#fff'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.06)'; el.style.color = 'rgba(255,255,255,0.8)'; }}
              >
                Try Pro — $9/mo
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}