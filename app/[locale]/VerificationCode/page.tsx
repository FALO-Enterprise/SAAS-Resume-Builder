'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowRight, Loader2, Check, RefreshCw, ArrowLeft, MailOpen } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import Logo from '@/components/ui/Logo';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds


// ─────────────────────────────────────────────────────────────────────────────
// Single OTP digit box
// ─────────────────────────────────────────────────────────────────────────────
function OtpBox({
  value,
  focused,
  hasError,
  index,
  inputRef,
  onChange,
  onKeyDown,
  onPaste,
  onFocus,
  onBlur,
}: {
  value: string;
  focused: boolean;
  hasError: boolean;
  index: number;
  inputRef: (el: HTMLInputElement | null) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  onBlur: () => void;
}) {
  const borderColor = hasError
    ? 'rgba(248,113,113,0.6)'
    : focused
    ? '#f5a623'
    : value
    ? 'rgba(245,166,35,0.4)'
    : 'rgba(255,255,255,0.1)';

  const bg = hasError
    ? 'rgba(248,113,113,0.07)'
    : focused
    ? 'rgba(245,166,35,0.06)'
    : value
    ? 'rgba(245,166,35,0.03)'
    : 'rgba(255,255,255,0.03)';

  const shadow = focused
    ? '0 0 0 3px rgba(245,166,35,0.12)'
    : 'none';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 + index * 0.06 }}
      style={{ position: 'relative' }}
    >
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        maxLength={1}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onFocus={onFocus}
        onBlur={onBlur}
        style={{
          width: 54,
          height: 64,
          textAlign: 'center',
          fontSize: 26,
          fontWeight: 800,
          fontFamily: 'Playfair Display, serif',
          color: hasError ? '#f87171' : '#fff',
          background: bg,
          border: `1.5px solid ${borderColor}`,
          borderRadius: 14,
          outline: 'none',
          transition: 'all 0.2s',
          boxShadow: shadow,
          cursor: 'text',
          caretColor: 'transparent',
        }}
      />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Countdown timer hook
// ─────────────────────────────────────────────────────────────────────────────
function useCountdown(initial: number) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    if (count <= 0) return;
    const id = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [count]);

  const restart = useCallback(() => {
    setCount(initial);
  }, [initial]);

  return { count, expired: count <= 0, restart };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function VerifyPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  // email can be passed as query param from register: /verify?email=user@example.com
  const emailParam = searchParams.get('email') ?? '';

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { count, expired, restart } = useCountdown(RESEND_COOLDOWN);

  // Auto-focus first box on mount
  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 300);
  }, []);

  // ── Input handlers ──────────────────────────────────────────────────────
  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, ''); // digits only
    if (!raw) return;

    const digit = raw[raw.length - 1]; // take last char if multiple
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError('');

    if (index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = [...digits];
      if (next[index]) {
        // clear current
        next[index] = '';
        setDigits(next);
      } else if (index > 0) {
        // move to previous and clear
        next[index - 1] = '';
        setDigits(next);
        inputRefs.current[index - 1]?.focus();
      }
      setError('');
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      const code = digits.join('');
      if (code.length === CODE_LENGTH) handleSubmit(code);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = Array(CODE_LENGTH).fill('');
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    setError('');
    // focus last filled or last box
    const lastIndex = Math.min(pasted.length, CODE_LENGTH - 1);
    inputRefs.current[lastIndex]?.focus();
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (code: string) => {
    if (code.length < CODE_LENGTH) {
      setError('Please enter the complete 6-digit code.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // ── BACKEND CONNECTION ───────────────────────────────────────────────
      // POST /api/auth/verify
      // Body:     { email, code }
      // Response: { token, user }  →  verification successful
      //           { error }        →  invalid/expired code
      // ────────────────────────────────────────────────────────────────────
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailParam, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || 'Invalid code. Please try again.');
        setDigits(Array(CODE_LENGTH).fill(''));
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
        return;
      }

      if (data.token) localStorage.setItem('resumax_token', data.token);
      setSuccess(true);
      setTimeout(() => router.push(`/${locale}/dashboard`), 2000);

    } catch {
      setError('Network error. Please try again.');
      setDigits(Array(CODE_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

    // Auto-submit when all digits filled
  // useEffect(() => {
  //   if (digits.every(d => d !== '') && !loading && !success) {
  //     handleSubmit(digits.join(''));
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [digits]);

  // ── Resend ───────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (!expired || resending) return;
    setResending(true);
    setResendSuccess(false);
    setError('');

    try {
      // ── BACKEND CONNECTION ───────────────────────────────────────────────
      // POST /api/auth/resend-code
      // Body:     { email }
      // Response: { success: true }  |  { error }
      // ────────────────────────────────────────────────────────────────────
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailParam }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data?.error || 'Could not resend code. Try again.');
        return;
      }

      setResendSuccess(true);
      setDigits(Array(CODE_LENGTH).fill(''));
      restart();
      setTimeout(() => {
        inputRefs.current[0]?.focus();
        setResendSuccess(false);
      }, 2500);

    } catch {
      setError('Network error. Could not resend.');
    } finally {
      setResending(false);
    }
  };

  const filledCount = digits.filter(d => d !== '').length;
  const hasError = !!error;

  // ─────────────────────────────────────────────────────────────────────────
  // Success screen
  // ─────────────────────────────────────────────────────────────────────────
  if (success) {
    return (
      <main style={{
        minHeight: '100vh', background: '#0a0b0f',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px',
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'center', maxWidth: 360 }}
        >
          {/* Animated checkmark */}
          <motion.div
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 28px',
              background: 'rgba(74,222,128,0.12)',
              border: '1.5px solid rgba(74,222,128,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Check size={36} color="#4ade80" />
          </motion.div>

          <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 28, marginBottom: 10, fontFamily: 'Playfair Display, serif' }}>
            Email verified!
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
            Your account is now active. Taking you to your dashboard…
          </p>

          {/* Progress bar */}
          <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, ease: 'linear' }}
              style={{ height: '100%', background: 'linear-gradient(to right, #f5a623, #fbbf24)', borderRadius: 99 }}
            />
          </div>
        </motion.div>
      </main>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Main card
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <main style={{
      minHeight: '100vh', background: '#0a0b0f',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', position: 'relative', overflow: 'hidden',
    }}>

      {/* Background glows */}
      <div style={{ position: 'fixed', top: '15%', left: '5%', width: 500, height: 500, background: 'rgba(245,166,35,0.04)', filter: 'blur(120px)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '10%', right: '5%', width: 400, height: 400, background: 'rgba(29,78,216,0.05)', filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none' }} />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%', maxWidth: 480,
          background: '#13141a',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 28,
          padding: '40px 40px 48px',
          boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
          position: 'relative', zIndex: 10, overflow: 'hidden',
        }}
      >

        {/* Decorative glows inside card */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'radial-gradient(circle, rgba(245,166,35,0.08) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, background: 'radial-gradient(circle, rgba(29,78,216,0.08) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }} />

        {/* Logo */}
        <div style={{ marginBottom: 36 }}>
          <Link href={`/${locale}`} style={{ textDecoration: 'none' }}>
            <Logo />
          </Link>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          {/* Icon */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'rgba(245,166,35,0.1)',
              border: '1px solid rgba(245,166,35,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <ShieldCheck size={26} color="#f5a623" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={{ color: '#fff', fontWeight: 800, fontSize: 24, marginBottom: 8, fontFamily: 'Playfair Display, serif' }}
          >
            Check your email
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.7 }}
          >
            We sent a 6-digit verification code to{' '}
            {emailParam
              ? <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{emailParam}</span>
              : 'your email address'
            }.
            {' '}Enter it below to verify your account.
          </motion.p>
        </div>

        {/* OTP boxes */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            display: 'flex', gap: 10, justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            {digits.map((digit, i) => (
              <OtpBox
                key={i}
                index={i}
                value={digit}
                focused={focusedIndex === i}
                hasError={hasError}
                inputRef={el => { inputRefs.current[i] = el; }}
                onChange={e => handleChange(i, e)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={handlePaste}
                onFocus={() => { setFocusedIndex(i); setError(''); }}
                onBlur={() => setFocusedIndex(null)}
              />
            ))}
          </div>

          {/* Progress dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
            {digits.map((d, i) => (
              <motion.div
                key={i}
                animate={{
                  background: d ? '#f5a623' : 'rgba(255,255,255,0.1)',
                  scale: d ? 1.2 : 1,
                }}
                transition={{ duration: 0.2 }}
                style={{ width: 5, height: 5, borderRadius: '50%' }}
              />
            ))}
          </div>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              style={{
                background: 'rgba(248,113,113,0.1)',
                border: '1px solid rgba(248,113,113,0.25)',
                borderRadius: 10, padding: '12px 16px',
                color: '#f87171', fontSize: 13,
                textAlign: 'center', marginBottom: 20,
              }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Resend success message */}
        <AnimatePresence>
          {resendSuccess && (
            <motion.div
              key="resend-success"
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              style={{
                background: 'rgba(74,222,128,0.08)',
                border: '1px solid rgba(74,222,128,0.2)',
                borderRadius: 10, padding: '12px 16px',
                color: '#4ade80', fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginBottom: 20,
              }}
            >
              <MailOpen size={14} />
              A new code has been sent to your email.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Verify button */}
        <button
          onClick={() => handleSubmit(digits.join(''))}
          // disabled={loading || count > 0}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '15px 24px', borderRadius: 12, border: 'none',
            fontWeight: 700, fontSize: 15, cursor: loading || filledCount < CODE_LENGTH ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            background: loading || filledCount < CODE_LENGTH
              ? 'rgba(245,166,35,0.4)'
              : '#f5a623',
            color: '#0a0b0f',
            boxShadow: loading || filledCount < CODE_LENGTH
              ? 'none'
              : '0 8px 25px rgba(245,166,35,0.3)',
            marginBottom: 24,
          }}
          onMouseEnter={e => {
            if (!loading && filledCount === CODE_LENGTH) {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 35px rgba(245,166,35,0.45)';
            }
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLElement).style.boxShadow = filledCount === CODE_LENGTH ? '0 8px 25px rgba(245,166,35,0.3)' : 'none';
          }}
        >
          {loading
            ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Verifying…</>
            : <><span>Verify Email</span><ArrowRight size={16} /></>
          }
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>didn&apos;t receive it?</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
        </div>

        {/* Resend row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <button
            onClick={handleResend}
            disabled={!expired || resending}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none',
              fontSize: 13, fontWeight: 600,
              cursor: expired && !resending ? 'pointer' : 'default',
              color: expired && !resending ? '#f5a623' : 'rgba(255,255,255,0.25)',
              transition: 'color 0.2s',
              padding: '4px 0',
            }}
          >
            {resending
              ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Sending…</>
              : <><RefreshCw size={13} /> Resend code</>
            }
          </button>

          {!expired && (
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
              in{' '}
              <span
                style={{
                  color: count <= 10 ? '#f87171' : 'rgba(255,255,255,0.45)',
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                  transition: 'color 0.3s',
                  display: 'inline-block',
                  minWidth: 42,
                  textAlign: 'center',
                }}
              >
                {String(Math.floor(count / 60)).padStart(2, '0')}:{String(count % 60).padStart(2, '0')}
              </span>
            </span>
          )}
        </div>

        {/* Back link */}
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
          <Link
            href={`/${locale}/CreateAccount`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: 'rgba(255,255,255,0.35)', fontSize: 13, textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'}
          >
            <ArrowLeft size={13} /> Back to register
          </Link>
        </div>
      </motion.div>

      {/* Bottom note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 24, textAlign: 'center' }}
      >
        The code expires in 10 minutes. Check your spam folder if you don&apos;t see it.
      </motion.p>
    </main>
  );
}