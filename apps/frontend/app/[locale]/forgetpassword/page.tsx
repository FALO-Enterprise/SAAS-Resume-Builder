// "use client";

// import { useMemo, useState } from "react";
// import { AnimatePresence, motion } from "framer-motion";
// import {
//   ArrowLeft,
//   ArrowRight,
//   Check,
//   Loader2,
//   Mail,
//   RefreshCw,
//   ShieldCheck,
// } from "lucide-react";
// import Link from "next/link";
// import { useLocale, useTranslations } from "next-intl";
// import AuthInput from "@/components/ui/AuthInput";
// import Logo from "@/components/ui/Logo";
// import { useCountdown } from "@/hooks/useCountdown";
// import type {
//   ForgotPasswordData,
//   ForgotPasswordErrors,
// } from "@/lib/types/auth.types";
// import { requestPasswordReset } from "@/lib/api/auth";

// const RESEND_COOLDOWN = 60;

// export default function ForgetPasswordPage() {
//   const locale = useLocale();

//   const t = useTranslations("auth.passwordRecovery");
//   const verifyT = useTranslations("verify");

//   const isRTL = locale === "ar";

//   const [email, setEmail] = useState<ForgotPasswordData["email"]>("");
//   const [errors, setErrors] = useState<ForgotPasswordErrors>({});

//   const [sent, setSent] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const [resending, setResending] = useState(false);
//   const [resendSuccess, setResendSuccess] = useState(false);

//   const { count, expired, restart } = useCountdown(RESEND_COOLDOWN);

//   const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

//   const validateEmail = () => {
//     const e: ForgotPasswordErrors = {};

//     if (!normalizedEmail) {
//       e.email = t("errors.emailRequired");
//     } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
//       e.email = t("errors.invalidEmail");
//     }

//     if (!normalizedEmail) e.email = t("errors.emailRequired");
//     else if (!/\S+@\S+\.\S+/.test(normalizedEmail))
//       e.email = t("errors.invalidEmail");
//     setErrors(e);
//     return Object.keys(e).length === 0;
//   };

//   const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
//     event.preventDefault();

//     if (!validateEmail()) return;

//     setLoading(true);
//     setErrors({});
//     setResendSuccess(false);

//     try {
//       await requestPasswordReset({
//         email: normalizedEmail,
//         locale: locale === "ar" ? "ar" : "en",
//       });

//       setSent(true);
//       restart();
//     } catch {
//       setErrors({
//         general: t("errors.network"),
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleResend = async () => {
//     if (!expired || resending || !validateEmail()) return;

//     setResending(true);

//     setErrors((prev) => ({
//       ...prev,
//       general: undefined,
//     }));

//     setResendSuccess(false);

//     try {
//       await requestPasswordReset({
//         email: normalizedEmail,
//         locale: locale === "ar" ? "ar" : "en",
//       });

//       setResendSuccess(true);
//       restart();

//       setTimeout(() => {
//         setResendSuccess(false);
//       }, 2500);
//     } catch {
//       setErrors({
//         general: t("errors.network"),
//       });
//     } finally {
//       setResending(false);
//     }
//   };

//   return (
//     <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-base px-6 py-10">
//       {/* Background glows */}
//       <div className="pointer-events-none fixed left-[6%] top-[12%] h-125 w-125 rounded-full bg-gold/5 blur-[120px]" />

//       <div className="pointer-events-none fixed bottom-[8%] right-[6%] h-107.5 w-107.5 rounded-full bg-azure/5 blur-[110px]" />

//       <motion.div
//         initial={{ opacity: 0, y: 35 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.45 }}
//         className="relative z-10 w-full max-w-130 overflow-hidden rounded-[28px] border border-edge bg-elevated px-6 pb-12 pt-10 shadow-[0_40px_100px_var(--shadow-color)] sm:px-10"
//       >
//         {/* Card glows */}
//         <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold/5 blur-3xl" />

//         <div className="pointer-events-none absolute -bottom-14 -left-14 h-52 w-52 rounded-full bg-azure/5 blur-3xl" />

//         {/* Logo */}
//         <div className="relative z-10 mb-12 flex justify-center">
//           <Link href={`/${locale}`} className="no-underline">
//             <Logo />
//           </Link>
//         </div>

//         {errors.general && (
//           <motion.div
//             initial={{ opacity: 0, y: -8 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="mb-6 rounded-[10px] border border-pink-light/25 bg-pink-light/10 px-4 py-3 text-center text-[13px] text-pink-light"
//           >
//             {errors.general}
//           </motion.div>
//         )}

//         <AnimatePresence mode="wait">
//           {!sent ? (
//             <motion.form
//               key="email-form"
//               noValidate
//               onSubmit={handleSubmit}
//               initial={{ opacity: 0, y: 18 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -18 }}
//               transition={{ duration: 0.25 }}
//               className="relative z-10"
//             >
//               {/* Icon */}
//               <div className="mb-7 flex justify-center">
//                 <div className="flex h-15.5 w-15.5 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10">
//                   <Mail size={28} className="text-gold" />
//                 </div>
//               </div>

//               {/* Header */}
//               <div className="mb-9 text-center">
//                 <h1 className="mb-3 font-playfair text-[28px] font-extrabold leading-tight text-primary">
//                   {t("title")}
//                 </h1>

//                 <p className="mx-auto max-w-95 text-sm leading-7 text-faint">
//                   {t("subtitle")}
//                 </p>
//               </div>

//               {/* Email input */}
//               <div className="mb-7">
//                 <AuthInput
//                   icon={Mail}
//                   type="email"
//                   label={t("emailLabel")}
//                   placeholder={t("emailPlaceholder")}
//                   value={email}
//                   onChange={(v) => {
//                     setEmail(v);
//                     setErrors((current) => ({
//                       ...current,
//                       email: undefined,
//                     }));
//                   }}
//                   error={errors.email}
//                 />
//               </div>

//               {/* Send button */}
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="mb-9 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gold px-6 py-4 text-[15px] font-bold text-ink shadow-[0_8px_25px_rgba(245,166,35,0.28)] transition-all hover:-translate-y-px hover:shadow-[0_12px_35px_rgba(245,166,35,0.42)] disabled:cursor-not-allowed disabled:bg-gold/45 disabled:shadow-none"
//               >
//                 {loading ? (
//                   <>
//                     <Loader2 size={16} className="animate-spin" />
//                     {t("sending")}
//                   </>
//                 ) : (
//                   <>
//                     <span>{t("sendButton")}</span>

//                     <ArrowRight
//                       size={16}
//                       className={isRTL ? "rotate-180" : ""}
//                     />
//                   </>
//                 )}
//               </button>

//               {/* Divider */}
//               <div className="mb-7 flex items-center gap-3">
//                 <div className="h-px flex-1 bg-edge" />

//                 <span className="text-xs text-muted">{t("remembered")}</span>

//                 <div className="h-px flex-1 bg-edge" />
//               </div>

//               {/* Login link */}
//               <div className="text-center">
//                 <Link
//                   href={`/${locale}`}
//                   className="inline-flex items-center gap-2 text-[13px] font-semibold text-muted no-underline transition-colors hover:text-gold"
//                 >
//                   <ArrowLeft size={13} className={isRTL ? "rotate-180" : ""} />

//                   {t("signIn")}
//                 </Link>
//               </div>
//             </motion.form>
//           ) : (
//             <motion.div
//               key="sent-email"
//               initial={{ opacity: 0, y: 18 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -18 }}
//               transition={{ duration: 0.25 }}
//               className="relative z-10 text-center"
//             >
//               {/* Icon */}
//               <div className="mb-7 flex justify-center">
//                 <div className="flex h-15.5 w-15.5 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10">
//                   <ShieldCheck size={28} className="text-gold" />
//                 </div>
//               </div>

//               {/* Sent message */}
//               <div className="mb-8">
//                 <h1 className="mb-3 font-playfair text-[28px] font-extrabold leading-tight text-primary">
//                   {t("sentTitle")}
//                 </h1>

//                 <p className="mx-auto max-w-97.5 text-sm leading-7 text-faint">
//                   {t("sentSubtitle", {
//                     email: normalizedEmail,
//                   })}
//                 </p>
//               </div>

//               {/* Success check */}
//               <div className="mb-8 flex justify-center">
//                 <div className="flex h-14 w-14 items-center justify-center rounded-full border border-green/30 bg-green/10">
//                   <Check size={26} className="text-green" />
//                 </div>
//               </div>

//               {/* Resend success message */}
//               <AnimatePresence>
//                 {resendSuccess && (
//                   <motion.div
//                     key="resend-success"
//                     initial={{
//                       opacity: 0,
//                       y: -8,
//                       height: 0,
//                     }}
//                     animate={{
//                       opacity: 1,
//                       y: 0,
//                       height: "auto",
//                     }}
//                     exit={{
//                       opacity: 0,
//                       y: -8,
//                       height: 0,
//                     }}
//                     className="mb-6 rounded-[10px] border border-green/20 bg-green/10 px-4 py-3 text-[13px] text-green"
//                   >
//                     {t("resendSuccess")}
//                   </motion.div>
//                 )}
//               </AnimatePresence>

//               {/* Divider */}
//               <div className="mb-7 flex items-center gap-3">
//                 <div className="h-px flex-1 bg-edge" />

//                 <span className="text-xs text-muted">
//                   {t("resendQuestion")}
//                 </span>

//                 <div className="h-px flex-1 bg-edge" />
//               </div>

//               {/* Resend button and countdown */}
//               <div className="mb-9 flex items-center justify-center gap-2">
//                 <button
//                   type="button"
//                   onClick={handleResend}
//                   disabled={!expired || resending}
//                   className={`flex items-center gap-1.5 border-none bg-transparent py-1 text-[13px] font-semibold transition-colors ${
//                     expired && !resending
//                       ? "cursor-pointer text-gold"
//                       : "cursor-default text-muted"
//                   }`}
//                 >
//                   {resending ? (
//                     <>
//                       <Loader2 size={13} className="animate-spin" />

//                       {t("sending")}
//                     </>
//                   ) : (
//                     <>
//                       <RefreshCw size={13} />
//                       {t("resendButton")}
//                     </>
//                   )}
//                 </button>

//                 {!expired && (
//                   <span className="text-[13px] text-muted">
//                     {verifyT("resendIn")}{" "}
//                     <span
//                       className={`inline-block min-w-10.5 text-center font-semibold tabular-nums transition-colors ${
//                         count <= 10 ? "text-pink-light" : "text-faint"
//                       }`}
//                     >
//                       {String(Math.floor(count / 60)).padStart(2, "0")}:
//                       {String(count % 60).padStart(2, "0")}
//                     </span>
//                   </span>
//                 )}
//               </div>

//               {/* Back to login */}
//               <div className="border-t border-edge pt-8">
//                 <Link
//                   href={`/${locale}`}
//                   className="inline-flex items-center gap-2 text-[13px] font-semibold text-muted no-underline transition-colors hover:text-gold"
//                 >
//                   <ArrowLeft size={13} className={isRTL ? "rotate-180" : ""} />

//                   {t("backToLogin")}
//                 </Link>
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </motion.div>
//     </main>
//   );
// }


"use client";

import { useMemo, useState } from "react";
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
import type { ForgotPasswordErrors } from "@/lib/types/auth.types";
import { useForgotPasswordFlow } from "@/hooks/mutations/useForgotPasswordFlow";

export default function ForgetPasswordPage() {
  const locale = useLocale();
  const t = useTranslations("auth.passwordRecovery");
  const verifyT = useTranslations("verify");
  const isRTL = locale === "ar";

  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<ForgotPasswordErrors>({});

  const {
    request,
    resend,
    isPending,
    sent,
    resendSuccess,
    generalError,
    count,
    expired,
  } = useForgotPasswordFlow();

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const validateEmail = () => {
    const e: ForgotPasswordErrors = {};

    if (!normalizedEmail) {
      e.email = t("errors.emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      e.email = t("errors.invalidEmail");
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateEmail()) return;
    await request(normalizedEmail, locale === "ar" ? "ar" : "en", t("errors.network"));
  };

  const handleResend = async () => {
    await resend(normalizedEmail, locale === "ar" ? "ar" : "en", t("errors.network"));
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-base px-6 py-10">
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

        {generalError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-[10px] border border-pink-light/25 bg-pink-light/10 px-4 py-3 text-center text-[13px] text-pink-light"
          >
            {generalError}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.form
              key="email-form"
              noValidate
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
                  onChange={(v) => {
                    setEmail(v);
                    setErrors((current) => ({ ...current, email: undefined }));
                  }}
                  error={errors.email}
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="mb-9 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gold px-6 py-4 text-[15px] font-bold text-ink shadow-[0_8px_25px_rgba(245,166,35,0.28)] transition-all hover:-translate-y-px hover:shadow-[0_12px_35px_rgba(245,166,35,0.42)] disabled:cursor-not-allowed disabled:bg-gold/45 disabled:shadow-none"
              >
                {isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {t("sending")}
                  </>
                ) : (
                  <>
                    <span>{t("sendButton")}</span>
                    <ArrowRight size={16} className={isRTL ? "rotate-180" : ""} />
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
                  <ArrowLeft size={13} className={isRTL ? "rotate-180" : ""} />
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
                <span className="text-xs text-muted">{t("resendQuestion")}</span>
                <div className="h-px flex-1 bg-edge" />
              </div>

              <div className="mb-9 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={!expired || isPending}
                  className={`flex items-center gap-1.5 border-none bg-transparent py-1 text-[13px] font-semibold transition-colors ${
                    expired && !isPending
                      ? "cursor-pointer text-gold"
                      : "cursor-default text-muted"
                  }`}
                >
                  {isPending ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      {t("sending")}
                    </>
                  ) : (
                    <>
                      <RefreshCw size={13} />
                      {t("resendButton")}
                    </>
                  )}
                </button>

                {!expired && (
                  <span className="text-[13px] text-muted">
                    {verifyT("resendIn")}{" "}
                    <span
                      className={`inline-block min-w-10.5 text-center font-semibold tabular-nums transition-colors ${
                        count <= 10 ? "text-pink-light" : "text-faint"
                      }`}
                    >
                      {String(Math.floor(count / 60)).padStart(2, "0")}:
                      {String(count % 60).padStart(2, "0")}
                    </span>
                  </span>
                )}
              </div>

              <div className="border-t border-edge pt-8">
                <Link
                  href={`/${locale}`}
                  className="inline-flex items-center gap-2 text-[13px] font-semibold text-muted no-underline transition-colors hover:text-gold"
                >
                  <ArrowLeft size={13} className={isRTL ? "rotate-180" : ""} />
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