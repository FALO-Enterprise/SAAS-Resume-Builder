"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  ArrowRight,
  Loader2,
  Check,
  RefreshCw,
  ArrowLeft,
  MailOpen,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";

import Logo from "@/components/ui/Logo";
import { useAuth } from "@/context/AuthContext";
import { useVerifyAccountFlow } from "@/hooks/mutations/useVerifyAccountFlow";

const CODE_LENGTH = 6;

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
  const stateClasses = hasError
    ? "border-pink-light/60 bg-pink-light/[0.07] text-pink-light"
    : focused
      ? "border-gold bg-gold/[0.06] text-primary shadow-[0_0_0_3px_rgba(245,166,35,0.12)]"
      : value
        ? "border-gold/40 bg-gold/[0.03] text-primary"
        : "border-edge-strong bg-card text-primary";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: 0.05 + index * 0.06,
      }}
      className="relative"
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
        className={`h-16 w-13.5 rounded-[14px] border-[1.5px] text-center font-playfair text-[26px] font-extrabold caret-transparent outline-none transition-all ${stateClasses}`}
      />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function VerifyPage() {
  const locale = useLocale();
  const t = useTranslations("verify");

  const searchParams = useSearchParams();
  const router = useRouter();

  const { login } = useAuth();

  const emailParam = searchParams.get("email") ?? "";

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));

  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const {
    verify,
    resend,
    clearError,

    isVerifying,
    isResending,

    generalError,

    success,
    verifiedUser,

    resendSuccess,

    count,
    expired,
  } = useVerifyAccountFlow(CODE_LENGTH);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Keep the latest `login` function in a ref so the redirect effect
  // below does NOT re-run (and reset its 2s timer) every time the
  // AuthProvider re-renders and creates a new `login` function reference.
  const loginRef = useRef(login);

  useEffect(() => {
    loginRef.current = login;
  }, [login]);

  // ─────────────────────────────────────────────────────────────────────────
  // Redirect after success screen
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!success || !verifiedUser) {
      return;
    }

    const timer = setTimeout(() => {
      /*
       * IMPORTANT:
       *
       * We update AuthContext only AFTER the success screen
       * has been visible for 2 seconds.
       */
      loginRef.current(verifiedUser);

      router.push(`/${locale}`);
    }, 2000);

    return () => {
      clearTimeout(timer);
    };
  }, [success, verifiedUser, locale, router]);

  // ─────────────────────────────────────────────────────────────────────────
  // Initial focus
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Submit
  // ─────────────────────────────────────────────────────────────────────────

  const handleSubmit = async (code: string) => {
    const result = await verify(emailParam, code, t("errors.network"));

    if (!result.ok) {
      setDigits(Array(CODE_LENGTH).fill(""));

      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 50);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Input change
  // ─────────────────────────────────────────────────────────────────────────

  const handleChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const raw = e.target.value.replace(/\D/g, "");

    if (!raw) {
      return;
    }

    const digit = raw[raw.length - 1];

    const next = [...digits];
    next[index] = digit;

    setDigits(next);
    clearError();

    if (index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Keyboard
  // ─────────────────────────────────────────────────────────────────────────

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      e.preventDefault();

      const next = [...digits];

      if (next[index]) {
        next[index] = "";
        setDigits(next);
      } else if (index > 0) {
        next[index - 1] = "";

        setDigits(next);

        inputRefs.current[index - 1]?.focus();
      }

      clearError();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === "Enter") {
      const code = digits.join("");

      if (code.length === CODE_LENGTH && !isVerifying) {
        handleSubmit(code);
      }
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Paste
  // ─────────────────────────────────────────────────────────────────────────

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();

    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, CODE_LENGTH);

    if (!pasted) {
      return;
    }

    const next = Array(CODE_LENGTH).fill("");

    pasted.split("").forEach((character, index) => {
      next[index] = character;
    });

    setDigits(next);
    clearError();

    const lastIndex = Math.min(pasted.length, CODE_LENGTH - 1);

    inputRefs.current[lastIndex]?.focus();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Resend
  // ─────────────────────────────────────────────────────────────────────────

  const handleResend = async () => {
    const ok = await resend(emailParam, t("errors.resendNetwork"), () => {
      inputRefs.current[0]?.focus();
    });

    if (ok) {
      setDigits(Array(CODE_LENGTH).fill(""));
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Derived state
  // ─────────────────────────────────────────────────────────────────────────

  const filledCount = digits.filter((digit) => digit !== "").length;

  const hasError = !!generalError;

  const canSubmit = !isVerifying && filledCount === CODE_LENGTH;

  // ─────────────────────────────────────────────────────────────────────────
  // SUCCESS SCREEN
  // ─────────────────────────────────────────────────────────────────────────

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-base px-6 py-10">
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.9,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          transition={{
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="max-w-90 text-center"
        >
          {/* Animated checkmark */}

          <motion.div
            animate={{
              scale: [0, 1.2, 1],
            }}
            transition={{
              duration: 0.5,
              delay: 0.1,
            }}
            className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full border-[1.5px] border-green/30 bg-green/12"
          >
            <Check size={36} className="text-green" />
          </motion.div>

          <h2 className="mb-2.5 font-playfair text-[28px] font-extrabold text-primary">
            {t("success.title")}
          </h2>

          <p className="mb-8 text-[15px] leading-[1.7] text-faint">
            {t("success.subtitle")}
          </p>

          {/* 2 second progress bar */}

          <div className="h-0.75 overflow-hidden rounded-full bg-card">
            <motion.div
              initial={{
                width: 0,
              }}
              animate={{
                width: "100%",
              }}
              transition={{
                duration: 2,
                ease: "linear",
              }}
              className="h-full rounded-full bg-linear-to-r from-gold to-gold-light"
            />
          </div>
        </motion.div>
      </main>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VERIFICATION SCREEN
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-base px-6 py-10">
      {/* Background glows */}

      <div className="pointer-events-none fixed left-[5%] top-[15%] h-125 w-125 rounded-full bg-gold/4 blur-[120px]" />

      <div className="pointer-events-none fixed bottom-[10%] right-[5%] h-100 w-100 rounded-full bg-azure/5 blur-[100px]" />

      {/* Card */}

      <motion.div
        initial={{
          opacity: 0,
          y: 32,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.5,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="relative z-10 w-full max-w-120 overflow-hidden rounded-[28px] border border-edge bg-elevated px-10 pb-12 pt-10 shadow-[0_40px_100px_var(--shadow-color)]"
      >
        {/* Decorative glows */}

        <div className="pointer-events-none absolute -top-15 -right-15 h-50 w-50 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-gold)_8%,transparent)_0%,transparent_70%)]" />

        <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-azure)_8%,transparent)_0%,transparent_70%)]" />

        {/* Logo */}

        <div className="mb-9">
          <Link href={`/${locale}`} className="no-underline">
            <Logo />
          </Link>
        </div>

        {/* Header */}

        <div className="mb-8">
          <motion.div
            initial={{
              scale: 0.5,
              opacity: 0,
            }}
            animate={{
              scale: 1,
              opacity: 1,
            }}
            transition={{
              duration: 0.4,
              delay: 0.15,
            }}
            className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/20 bg-gold/10"
          >
            <ShieldCheck size={26} className="text-gold" />
          </motion.div>

          <motion.h1
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.4,
              delay: 0.2,
            }}
            className="mb-2 font-playfair text-2xl font-extrabold text-primary"
          >
            {t("heading")}
          </motion.h1>

          <motion.p
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.4,
              delay: 0.25,
            }}
            className="text-sm leading-[1.7] text-faint"
          >
            {t("subtitlePrefix")}{" "}
            {emailParam ? (
              <span className="font-semibold text-secondary">{emailParam}</span>
            ) : (
              t("subtitleFallback")
            )}
            {". "}
            {t("subtitleSuffix")}
          </motion.p>
        </div>

        {/* OTP boxes */}

        <div className="mb-7">
          <div dir="ltr" className="flex justify-center gap-1.5 sm:gap-2.5">
            {digits.map((digit, index) => (
              <OtpBox
                key={index}
                index={index}
                value={digit}
                focused={focusedIndex === index}
                hasError={hasError}
                inputRef={(element) => {
                  inputRefs.current[index] = element;
                }}
                onChange={(e) => handleChange(index, e)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                onFocus={() => {
                  setFocusedIndex(index);
                  clearError();
                }}
                onBlur={() => setFocusedIndex(null)}
              />
            ))}
          </div>

          {/* Progress dots */}

          <div className="mt-4 flex justify-center gap-1.5">
            {digits.map((digit, index) => (
              <motion.div
                key={index}
                animate={{
                  scale: digit ? 1.2 : 1,
                }}
                transition={{
                  duration: 0.2,
                }}
                className={`h-1.25 w-1.25 rounded-full transition-colors ${digit ? "bg-gold" : "bg-edge-strong"
                  }`}
              />
            ))}
          </div>
        </div>

        {/* General error */}

        <AnimatePresence>
          {generalError && (
            <motion.div
              key="error"
              initial={{
                opacity: 0,
                y: -8,
                height: 0,
              }}
              animate={{
                opacity: 1,
                y: 0,
                height: "auto",
              }}
              exit={{
                opacity: 0,
                y: -8,
                height: 0,
              }}
              className="mb-5 rounded-[10px] border border-pink-light/25 bg-pink-light/10 px-4 py-3 text-center text-[13px] text-pink-light"
            >
              {generalError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Resend success */}

        <AnimatePresence>
          {resendSuccess && (
            <motion.div
              key="resend-success"
              initial={{
                opacity: 0,
                y: -8,
                height: 0,
              }}
              animate={{
                opacity: 1,
                y: 0,
                height: "auto",
              }}
              exit={{
                opacity: 0,
                y: -8,
                height: 0,
              }}
              className="mb-5 flex items-center justify-center gap-2 rounded-[10px] border border-green/20 bg-green/8 px-4 py-3 text-[13px] text-green"
            >
              <MailOpen size={14} />
              {t("resendSuccess")}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Verify button */}

        <button
          onClick={() => handleSubmit(digits.join(""))}
          disabled={!canSubmit}
          className={`mb-6 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.75 text-[15px] font-bold text-ink transition-all ${canSubmit
              ? "cursor-pointer bg-gold shadow-[0_8px_25px_rgba(245,166,35,0.3)] hover:-translate-y-px hover:shadow-[0_12px_35px_rgba(245,166,35,0.45)]"
              : "cursor-not-allowed bg-gold/40"
            }`}
        >
          {isVerifying ? (
            <>
              <Loader2 size={16} className="animate-spin" />

              {t("verifying")}
            </>
          ) : (
            <>
              <span>{t("verifyButton")}</span>

              <ArrowRight size={16} />
            </>
          )}
        </button>

        {/* Divider */}

        <div className="mb-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-edge" />

          <span className="text-xs text-muted">{t("dividerText")}</span>

          <div className="h-px flex-1 bg-edge" />
        </div>

        {/* Resend */}

        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handleResend}
            disabled={!expired || isResending}
            className={`flex items-center gap-1.5 border-none bg-transparent py-1 text-[13px] font-semibold transition-colors ${expired && !isResending
                ? "cursor-pointer text-gold"
                : "cursor-default text-muted"
              }`}
          >
            {isResending ? (
              <>
                <Loader2 size={13} className="animate-spin" />

                {t("resending")}
              </>
            ) : (
              <>
                <RefreshCw size={13} />

                {t("resend")}
              </>
            )}
          </button>

          {!expired && (
            <span className="text-[13px] text-muted">
              {t("resendIn")}{" "}
              <span
                className={`inline-block min-w-10.5 text-center font-semibold tabular-nums transition-colors ${count <= 10 ? "text-pink-light" : "text-faint"
                  }`}
              >
                {String(Math.floor(count / 60)).padStart(2, "0")}:
                {String(count % 60).padStart(2, "0")}
              </span>
            </span>
          )}
        </div>

        {/* Back to registration */}

        <div className="mt-8 border-t border-edge pt-6 text-center">
          <Link
            href={`/${locale}/createaccount`}
            className="inline-flex items-center gap-1.5 text-[13px] text-muted no-underline transition-colors hover:text-secondary"
          >
            <ArrowLeft size={13} />

            {t("backToRegister")}
          </Link>
        </div>
      </motion.div>

      {/* Bottom note */}

      <motion.p
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        transition={{
          delay: 0.5,
        }}
        className="mt-6 text-center text-xs text-secondary"
      >
        {t("bottomNote")}
      </motion.p>
    </main>
  );
}