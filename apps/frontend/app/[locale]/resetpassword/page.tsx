"use client";

import { Suspense, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import AuthInput from "@/components/ui/AuthInput";
import Logo from "@/components/ui/Logo";

function PasswordChecks({ password }: { password: string }) {
  const t = useTranslations("auth.resetPassword");

  const checks = [
    { label: t("checks.length"), pass: password.length >= 8 },
    { label: t("checks.uppercase"), pass: /[A-Z]/.test(password) },
    { label: t("checks.number"), pass: /\d/.test(password) },
    { label: t("checks.special"), pass: /[^A-Za-z0-9]/.test(password) },
  ];

  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="flex flex-wrap gap-x-4 gap-y-1.5"
    >
      {checks.map((check) => (
        <div key={check.label} className="flex items-center gap-1">
          <Check
            size={11}
            className={check.pass ? "text-green" : "text-muted"}
          />
          <span
            className={`text-[11px] ${
              check.pass ? "text-secondary" : "text-muted"
            }`}
          >
            {check.label}
          </span>
        </div>
      ))}
    </motion.div>
  );
}

function ResetPasswordContent() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth.resetPassword");
  const isRTL = locale === "ar";

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const isValidPassword = useMemo(() => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /\d/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    );
  }, [password]);

  const validate = () => {
    const nextErrors: {
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!password) {
      nextErrors.password = t("errors.passwordRequired");
    } else if (!isValidPassword) {
      nextErrors.password = t("errors.passwordWeak");
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = t("errors.confirmRequired");
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = t("errors.confirmMismatch");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token || !validate()) return;

    setLoading(true);

    // Frontend only for now.
    // Later backend can use:
    // POST /api/auth/reset-password
    // body: { token, password }

    window.setTimeout(() => {
      setSuccess(true);
      setLoading(false);

      window.setTimeout(() => {
        router.push(`/${locale}`);
      }, 1500);
    }, 800);
  };

  const eyeButton = (shown: boolean, toggle: () => void) => (
    <button
      type="button"
      onClick={toggle}
      className="cursor-pointer border-none bg-transparent p-1"
      aria-label={shown ? "Hide password" : "Show password"}
    >
      {shown ? (
        <EyeOff size={15} className="text-faint" />
      ) : (
        <Eye size={15} className="text-faint" />
      )}
    </button>
  );

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-base px-6 py-10 text-primary"
    >
      <div className="pointer-events-none fixed left-[6%] top-[12%] h-125 w-125nded-full bg-gold/5 blur-[120px]" />
      <div className="pointer-events-none fixed bottom-[8%] right-[6%] h-107.5-107.5 rounded-full bg-azure/5 blur-[110px]" />

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
          {!token ? (
            <motion.div
              key="invalid-token"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.25 }}
              className="relative z-10 text-center"
            >
              <div className="mb-7 flex justify-center">
                <div className="flex h-15.5 w-15.5 items-center justify-center rounded-2xl border border-pink-light/25 bg-pink-light/10">
                  <ShieldAlert size={28} className="text-pink-light" />
                </div>
              </div>

              <h1 className="mb-3 font-playfair text-[28px] font-extrabold leading-tight text-primary">
                {t("invalidTitle")}
              </h1>

              <p className="mx-auto mb-9 max-w-97.5 text-sm leading-7 text-faint">
                {t("invalidSubtitle")}
              </p>

              <Link
                href={`/${locale}/forgetpassword`}
                className="mb-8 flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-6 py-4 text-[15px] font-bold text-ink no-underline shadow-[0_8px_25px_rgba(245,166,35,0.28)] transition-all hover:-translate-y-px hover:shadow-[0_12px_35px_rgba(245,166,35,0.42)]"
              >
                {t("requestNewLink")}
                <ArrowRight size={16} className={isRTL ? "rotate-180" : ""} />
              </Link>

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
          ) : success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.25 }}
              className="relative z-10 py-8 text-center"
            >
              <div className="mb-7 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-green/30 bg-green/10">
                  <Check size={30} className="text-green" />
                </div>
              </div>

              <h1 className="mb-3 font-playfair text-[28px] font-extrabold leading-tight text-primary">
                {t("successTitle")}
              </h1>

              <p className="mx-auto max-w-97.5 text-sm leading-7 text-faint">
                {t("successSubtitle")}
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="reset-form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.25 }}
              className="relative z-10"
            >
              <div className="mb-7 flex justify-center">
                <div className="flex h-15.5 w-15.5 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10">
                  <ShieldCheck size={28} className="text-gold" />
                </div>
              </div>

              <div className="mb-9 text-center">
                <h1 className="mb-3 font-playfair text-[28px] font-extrabold leading-tight text-primary">
                  {t("title")}
                </h1>

                <p className="mx-auto max-w-97.5 text-sm leading-7 text-faint">
                  {t("subtitle")}
                </p>
              </div>

              <div className="mb-5 flex flex-col gap-2">
                <AuthInput
                  icon={Lock}
                  type={showPassword ? "text" : "password"}
                  label={t("passwordLabel")}
                  placeholder={t("passwordPlaceholder")}
                  value={password}
                  onChange={(value) => {
                    setPassword(value);
                    setErrors((current) => ({
                      ...current,
                      password: undefined,
                    }));
                  }}
                  error={errors.password}
                  rightSlot={eyeButton(showPassword, () =>
                    setShowPassword((current) => !current)
                  )}
                />

                <PasswordChecks password={password} />
              </div>

              <div className="mb-8">
                <AuthInput
                  icon={Lock}
                  type={showConfirm ? "text" : "password"}
                  label={t("confirmLabel")}
                  placeholder={t("confirmPlaceholder")}
                  value={confirmPassword}
                  onChange={(value) => {
                    setConfirmPassword(value);
                    setErrors((current) => ({
                      ...current,
                      confirmPassword: undefined,
                    }));
                  }}
                  error={errors.confirmPassword}
                  rightSlot={eyeButton(showConfirm, () =>
                    setShowConfirm((current) => !current)
                  )}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mb-8 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gold px-6 py-4 text-[15px] font-bold text-ink shadow-[0_8px_25px_rgba(245,166,35,0.28)] transition-all hover:-translate-y-px hover:shadow-[0_12px_35px_rgba(245,166,35,0.42)] disabled:cursor-not-allowed disabled:bg-gold/45 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {t("saving")}
                  </>
                ) : (
                  <>
                    {t("submit")}
                    <ArrowRight
                      size={16}
                      className={isRTL ? "rotate-180" : ""}
                    />
                  </>
                )}
              </button>

              <div className="border-t border-edge pt-8 text-center">
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
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-base px-6 py-10 text-primary">
          <div className="flex flex-col items-center justify-center rounded-[28px] border border-edge bg-elevated px-10 py-12 shadow-[0_40px_100px_var(--shadow-color)]">
            <Loader2 size={28} className="mb-4 animate-spin text-gold" />
          </div>
        </main>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}