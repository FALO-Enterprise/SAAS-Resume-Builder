"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useSyncCheckoutMutation } from "@/hooks/mutations/useBillingMutations";
import { getAccessToken } from "@/lib/auth/token";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const isRTL = locale === "ar";
  const { user, updateUser } = useAuth();
  const t = useTranslations("pricing.successModal");

  const planParam = searchParams.get("plan") || "pro";
  const transactionId = searchParams.get("transaction_id") || searchParams.get("id");
  const formattedPlan = (planParam || "PRO").toUpperCase();
  const isEnterprise = formattedPlan === "ENTERPRISE";

  const syncCheckoutMutation = useSyncCheckoutMutation();
  const hasRequestedSync = useRef(false);

  useEffect(() => {
    // `user` is null until AuthContext hydrates and it used to be missing from
    // this dependency list, so on a cold Paddle redirect the guard below failed
    // on the first commit and the effect never re-ran — the backend was never
    // told about the purchase at all. The ref is what keeps it to one call now
    // that `user` is a real dependency.
    if (hasRequestedSync.current || !user) return;
    if (!getAccessToken()) return;

    hasRequestedSync.current = true;

    syncCheckoutMutation.mutate(
      {
        planId: formattedPlan,
        transactionId: transactionId || undefined,
      },
      {
        // Only trust the plan the backend confirms. Previously both the
        // success and the failure branch wrote the optimistic plan, so a
        // failed sync left the client permanently believing it had upgraded.
        onSuccess: (result) => {
          updateUser({
            ...user,
            planName: result.plan as "PRO" | "ENTERPRISE",
          });
        },
        onError: (error) => {
          console.error("Failed to sync checkout:", error);
          toast.error(t("syncPending"));
        },
      },
    );
  }, [formattedPlan, transactionId, user, updateUser, syncCheckoutMutation, t]);

  const proFeatures = [
    t("features.pro.0"),
    t("features.pro.1"),
    t("features.pro.2"),
    t("features.pro.3"),
    t("features.pro.4"),
  ];

  const enterpriseFeatures = [
    t("features.enterprise.0"),
    t("features.enterprise.1"),
    t("features.enterprise.2"),
    t("features.enterprise.3"),
    t("features.enterprise.4"),
  ];

  const features = isEnterprise ? enterpriseFeatures : proFeatures;

  return (
    <main className="min-h-screen overflow-x-hidden bg-base text-primary">
      {/* Background Glows */}
      <div className="pointer-events-none fixed left-[10%] top-[10%] z-0 h-125 w-125 rounded-full bg-gold/5 blur-3xl" />
      <div className="pointer-events-none fixed bottom-[10%] right-[10%] z-0 h-100 w-100 rounded-full bg-vilot/10 blur-3xl" />

      <Navbar />

      <div className="relative z-1 mx-auto max-w-3xl px-6 py-24 sm:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl border border-gold/30 bg-card p-8 sm:p-12 shadow-[0_0_80px_rgba(245,166,35,0.12)] text-center relative overflow-hidden"
        >
          {/* Top Badge */}
          <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-gold/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-gold">
            <Sparkles size={14} className="text-gold" />
            <span>{t("badge")}</span>
          </div>

          {/* Success Check Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-gold/40 bg-linear-to-br from-gold/25 to-gold/5 shadow-[0_0_40px_rgba(245,166,35,0.3)]">
            <Check size={40} className="text-gold stroke-[2.5]" />
          </div>

          {/* Title */}
          <h1 className="mb-3 font-playfair text-3xl sm:text-4xl font-black leading-tight text-primary">
            {t("welcomeTitle", { plan: formattedPlan })}
          </h1>

          <p className="mx-auto mb-8 max-w-xl leading-relaxed text-secondary">
            {t("welcomeSubtitle", { plan: formattedPlan })}
          </p>

          {/* Receipt Details */}
          <div className="mx-auto mb-8 max-w-lg rounded-2xl border border-edge bg-primary/3 p-5 text-left space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">{t("planLabel")}</span>
              <span className="font-bold text-gold flex items-center gap-1.5">
                <Zap size={14} className="text-gold" />
                <span>ResuMax {formattedPlan}</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">{t("statusLabel")}</span>
              <span className="text-xs font-bold uppercase text-green bg-green/15 px-2.5 py-0.5 rounded-full">
                {t("statusActive")}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">{t("billingCycleLabel")}</span>
              <span className="font-medium text-secondary">{t("billingCycleValue")}</span>
            </div>
            {transactionId && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">{t("transactionLabel")}</span>
                <span className="font-mono text-xs text-faint truncate max-w-60">
                  {transactionId}
                </span>
              </div>
            )}
          </div>

          {/* Unlocked Features */}
          <div className="mx-auto mb-10 max-w-lg text-left">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-gold" />
              <span>{t("unlockedFeaturesTitle")}</span>
            </h4>
            <div className="grid grid-cols-1 gap-2.5">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-gold/15 border border-gold/30">
                    <Check size={11} className="text-gold stroke-[2.5]" />
                  </div>
                  <span className="text-sm text-secondary leading-snug">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => router.push(`/${locale}/dashboard`)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-8 py-4 text-sm font-bold text-ink shadow-[0_8px_24px_rgba(245,166,35,0.3)] hover:bg-gold-light hover:shadow-[0_12px_32px_rgba(245,166,35,0.45)] transition-all cursor-pointer"
            >
              <span>{t("ctaDashboard")}</span>
              <ArrowRight size={16} className={isRTL ? "rotate-180" : ""} />
            </button>

            <button
              type="button"
              onClick={() => router.push(`/${locale}/resume/preview`)}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-edge-strong bg-primary/5 px-7 py-4 text-sm font-semibold text-secondary hover:bg-primary/10 hover:text-primary transition-all cursor-pointer"
            >
              <span>{t("ctaBuilder")}</span>
            </button>
          </div>
        </motion.div>
      </div>

      <Footer />
    </main>
  );
}
