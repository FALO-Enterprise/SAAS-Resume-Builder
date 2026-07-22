"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import AuthInput from "@/components/ui/AuthInput";
import Logo from "@/components/ui/Logo";

const RESEND_COOLDOWN = 60;

function isValidEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value);
}

export default function ForgetPasswordPage() {
  const locale = useLocale();
  const t = useTranslations("auth.passwordRecovery");
  const isRTL = locale === "ar";

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = window.setTimeout(() => {
      setCooldown((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const validateEmail = () => {
    if (!normalizedEmail) {
      setEmailError(t("errors.emailRequired"));
      return false;
    }

    if (!isValidEmail(normalizedEmail)) {
      setEmailError(t("errors.invalidEmail"));
      return false;
    }

    setEmailError("");
    return true;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateEmail()) return;

    setLoading(true);
    setResendSuccess(false);

    // Frontend only for now.
    // Later backend can use:
    // POST /api/auth/forgot-password
    // body: { email: normalizedEmail, locale }

    window.setTimeout(() => {
      setLoading(false);
      setSent(true);
      setCooldown(RESEND_COOLDOWN);
    }, 700);
  };

  const handleResend = () => {
    if (cooldown > 0 || resending || !validateEmail()) return;

    setResending(true);
    setResendSuccess(false);

    // Frontend only for now.
    // Later backend can use:
    // POST /api/auth/forgot-password
    // body: { email: normalizedEmail, locale }

    window.setTimeout(() => {
      setResending(false);
      setResendSuccess(true);
      setCooldown(RESEND_COOLDOWN);

      window.setTimeout(() => {
        setResendSuccess(false);
      }, 2500);
    }, 700);
  };

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-base px-6 py-10"
    >
      <div className="pointer-events-none fixed left-[6%] top-[12%] h-125 w-125 rounded-full bg-gold/5 blur-[120px]" />
      <div className="pointer-events-none fixed bottom-[8%] right-[6%] h-107.5 w-107.5 rounded-full bg-azure/5 blur-[110px]" />

      <motion.div
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-130 overflow-hidden rounded-[28px] border border-edge bg-elevated px-6 pb-12 pt-10 shadow-[0_40px_100px_var(--shadow-color)] sm:px-10"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-14 -left-14 h-52 w-52 rounded-full bg-azure/5 blur-3xl" />

        <div className="relative z-10 mb-12 flex justify-center">
          <Link href={`/${locale}`} className="no-underline">
            <Logo />
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.form
              key="email-form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.25 }}
              className="relative z-10"
            >
              <div className="mb-7 flex justify-center">
                <div className="flex h-15.5 w-15.5 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10">
                  <Mail size={28} className="text-gold" />
                </div>
              </div>

              <div className="mb-9 text-center">
                <h1 className="mb-3 font-playfair text-[28px] font-extrabold leading-tight text-primary">
                  {t("title")}
                </h1>

                <p className="mx-auto max-w-95 text-sm leading-7 text-faint">
                  {t("subtitle")}
                </p>
              </div>

              <div className="mb-7">
                <AuthInput
                  icon={Mail}
                  type="email"
                  label={t("emailLabel")}
                  placeholder={t("emailPlaceholder")}
                  value={email}
                  onChange={(value) => {
                    setEmail(value);
                    setEmailError("");
                  }}
                  error={emailError}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mb-9 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gold px-6 py-4 text-[15px] font-bold text-ink shadow-[0_8px_25px_rgba(245,166,35,0.28)] transition-all hover:-translate-y-px hover:shadow-[0_12px_35px_rgba(245,166,35,0.42)] disabled:cursor-not-allowed disabled:bg-gold/45 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {t("sending")}
                  </>
                ) : (
                  <>
                    {t("sendButton")}
                    <ArrowRight
                      size={16}
                      className={isRTL ? "rotate-180" : ""}
                    />
                  </>
                )}
              </button>

              <div className="mb-7 flex items-center gap-3">
                <div className="h-px flex-1 bg-edge" />
                <span className="text-xs text-muted">{t("remembered")}</span>
                <div className="h-px flex-1 bg-edge" />
              </div>

              <div className="text-center">
                <Link
                  href={`/${locale}`}
                  className="inline-flex items-center gap-2 text-[13px] font-semibold text-muted no-underline transition-colors hover:text-gold"
                >
                  <ArrowLeft
                    size={13}
                    className={isRTL ? "rotate-180" : ""}
                  />
                  {t("signIn")}
                </Link>
              </div>
            </motion.form>
          ) : (
            <motion.div
              key="sent-email"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.25 }}
              className="relative z-10 text-center"
            >
              <div className="mb-7 flex justify-center">
                <div className="flex h-15.5 w-15.5 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10">
                  <ShieldCheck size={28} className="text-gold" />
                </div>
              </div>

              <div className="mb-8">
                <h1 className="mb-3 font-playfair text-[28px] font-extrabold leading-tight text-primary">
                  {t("sentTitle")}
                </h1>

                <p className="mx-auto max-w-97.5 text-sm leading-7 text-faint">
                  {t("sentSubtitle", { email: normalizedEmail })}
                </p>
              </div>

              <div className="mb-8 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-green/30 bg-green/10">
                  <Check size={26} className="text-green" />
                </div>
              </div>

              <AnimatePresence>
                {resendSuccess && (
                  <motion.div
                    key="resend-success"
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    className="mb-6 rounded-[10px] border border-green/20 bg-green/10 px-4 py-3 text-[13px] text-green"
                  >
                    {t("resendSuccess")}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mb-7 flex items-center gap-3">
                <div className="h-px flex-1 bg-edge" />
                <span className="text-xs text-muted">
                  {t("resendQuestion")}
                </span>
                <div className="h-px flex-1 bg-edge" />
              </div>

              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || resending}
                className={`mx-auto mb-9 flex w-full max-w-90 items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold transition-all ${
                  cooldown > 0 || resending
                    ? "cursor-not-allowed border-edge bg-card text-muted opacity-70"
                    : "cursor-pointer border-gold/35 bg-gold/10 text-gold shadow-[0_8px_24px_rgba(245,166,35,0.12)] hover:-translate-y-px hover:border-gold/60 hover:bg-gold/15 hover:text-gold-light"
                }`}
              >
                {resending ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    {t("sending")}
                  </>
                ) : (
                  <>
                    <RefreshCw size={15} />
                    {cooldown > 0
                      ? t("resendCountdown", { seconds: cooldown })
                      : t("resendButton")}
                  </>
                )}
              </button>

              <div className="border-t border-edge pt-8">
                <Link
                  href={`/${locale}`}
                  className="inline-flex items-center gap-2 text-[13px] font-semibold text-muted no-underline transition-colors hover:text-gold"
                >
                  <ArrowLeft
                    size={13}
                    className={isRTL ? "rotate-180" : ""}
                  />
                  {t("backToLogin")}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}